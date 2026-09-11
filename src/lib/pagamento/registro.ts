import 'server-only';
import { getRedis } from '@/lib/redis';
import { createLogger } from '@/lib/logger';
import { enviarEmail } from '@/lib/email/enviar';
import { assuntoInterno, htmlInterno, textoInterno } from '@/lib/email/pagamento-interno';
import {
  assuntoPagamento,
  deveAvisarPagamento,
  htmlPagamento,
  textoPagamento,
} from '@/lib/email/pagamento-confirmado';
import { consultarPedido, contatoDoPedido } from '@/lib/pedidos/servidor';
import { enviarPurchaseGa4, type ItemGa4 } from '@/lib/analytics/ga4-servidor';
import { CONTACT } from '@/lib/constants/site';

const log = createLogger('pagamento-registro');

/** Guarda o evento por 30 dias: reentrega do gateway pode vir muito depois. */
const TTL_SEGUNDOS = 30 * 24 * 60 * 60;

export type SituacaoPagamento = 'pago' | 'nao_pago';

export type EfeitoRegistro = 'registrado' | 'repetido' | 'sem-registro';

/**
 * Registra o que o gateway disse sobre um pedido.
 *
 * **Não mexe no STATUS do pedido de propósito.** A régua que o cliente vê
 * (recebido → em separação → a caminho → entregue) é alimentada pelo ERP, e
 * "pago" não é um passo dela hoje. Inventar um status aqui criaria duas fontes
 * escrevendo no mesmo campo — o ERP e o gateway — e a última a escrever
 * ganharia. Quando o Léo decidir se "pago" vira passo visível, isso passa a ser
 * uma linha; até lá, o pagamento é FATO REGISTRADO e avisado, não estado.
 *
 * A idempotência é obrigatória: o Asaas reentrega o mesmo evento quando não
 * recebe 2xx, e em instabilidade manda duplicado mesmo tendo recebido. Sem ela,
 * um pagamento vira dois avisos — e num futuro em que isso libere separação,
 * viraria dois envios.
 */
export async function registrarEventoPagamento(params: {
  eventoId: string;
  evento: string;
  numeroPedido: string;
  cobrancaId: string | null;
  situacao: SituacaoPagamento;
  valorCentavos: number;
  /** Venda parcelada: o gateway manda UM evento POR PARCELA. */
  parcelamento?: { id: string; totalCentavos: number; parcelas: number } | null;
}): Promise<EfeitoRegistro> {
  // A CHAVE DE IDEMPOTÊNCIA MUDA QUANDO A VENDA É PARCELADA.
  //
  // Pagar em 6x confirma as seis parcelas de uma vez, e o Asaas manda seis
  // eventos — cada um com id próprio e com o valor da PARCELA. Casando por
  // evento, isso vira seis avisos de "pagamento confirmado — R$ 725,00" num
  // pedido de R$ 4.350: quem lê conclui que entrou menos do que entrou, ou que
  // existem seis pedidos.
  //
  // Casando pelo PARCELAMENTO + situação, a venda avisa UMA vez — e um estorno
  // depois ainda avisa, porque a situação faz parte da chave.
  const chave = params.parcelamento
    ? `somatec:pagamento:parc:${params.parcelamento.id}:${params.situacao}`
    : `somatec:pagamento:${params.eventoId}`;
  const redis = getRedis();

  if (redis) {
    try {
      // SET NX EX (assinatura do ioredis, igual à usada na idempotência das
      // rotas): quem grava primeiro processa; os outros são reentrega.
      const novo = await redis.set(chave, JSON.stringify(params), 'EX', TTL_SEGUNDOS, 'NX');
      if (!novo) {
        log.info('evento repetido — ignorado', {
          evento: params.evento,
          pedido: params.numeroPedido,
        });
        return 'repetido';
      }
    } catch (err) {
      // Redis fora não pode engolir um pagamento: segue e registra. O risco
      // vira aviso duplicado, que é MUITO melhor que pagamento silencioso.
      log.warn('sem idempotencia (redis fora) — seguindo', { erro: String(err) });
    }
  }

  log.info('evento de pagamento', {
    evento: params.evento,
    pedido: params.numeroPedido,
    cobranca: params.cobrancaId,
    situacao: params.situacao,
    valorCentavos: params.valorCentavos,
  });

  // Aviso pra quem separa e fatura. É o elo humano enquanto "pago" não é um
  // estado do pedido: sem isto, o dinheiro entra e ninguém do outro lado sabe.
  //
  // O destino é configurável porque em TESTE ele não pode cair na caixa de quem
  // opera: aviso de "pagamento confirmado" que não corresponde a dinheiro
  // nenhum treina a pessoa a ignorar o aviso — e o dia em que for de verdade,
  // ela ignora também. Sem a variável, vai pro canal de sempre.
  const destino = process.env.PAGAMENTO_ALERTA_EMAIL?.trim() || CONTACT.email;
  const pago = params.situacao === 'pago';
  // O corpo do aviso mora em `pagamento-interno.ts`, na MESMA casca dos e-mails
  // de cliente. Até 09/09 era HTML cru montado aqui — três parágrafos sem marca,
  // que é o que chegava na caixa de quem opera.
  const aviso = {
    numeroPedido: params.numeroPedido,
    evento: params.evento,
    cobrancaId: params.cobrancaId,
    pago,
    valorCentavos: params.valorCentavos,
    parcelamento: params.parcelamento,
  };
  await enviarEmail({
    para: destino,
    assunto: assuntoInterno(aviso),
    html: htmlInterno(aviso),
    texto: textoInterno(aviso),
    marcador: `pagamento:${params.eventoId}`,
  }).catch((err) => {
    // O aviso falhar não pode derrubar o webhook: o Asaas reentregaria, e a
    // idempotência já teria marcado o evento como visto.
    log.error('aviso de pagamento nao enviado', { pedido: params.numeroPedido }, err);
  });

  // O aviso ao CLIENTE vem depois do interno de propósito: o interno é o que
  // destrava separação e faturamento, e não pode ficar atrás de nada.
  //
  // Só no caso `pago`. "Não concluído" é assunto interno — escrever pra alguém
  // dizendo que o pagamento falhou, quando o mais provável é que a pessoa tenha
  // só desistido no cartão, cria um problema que não existia.
  if (pago) {
    await avisarCliente({
      ...params,
      // O cliente tem que ver o TOTAL que ele comprou, não a parcela: "R$ 725,00
      // confirmados" numa compra de R$ 4.350 parece cobrança errada, e a
      // primeira reação é ligar perguntando o que aconteceu.
      valorCentavos: params.parcelamento?.totalCentavos ?? params.valorCentavos,
    }).catch((err) => {
      log.error('e-mail de pagamento ao cliente falhou', { pedido: params.numeroPedido }, err);
    });

    // O `purchase` do GA4 — POR ÚLTIMO, de propósito.
    //
    // Tudo acima é operação: o aviso interno destrava separação e faturamento,
    // o e-mail avisa quem pagou. Isto é relatório. Se o GA4 estiver fora, a
    // venda não pode esperar por ele.
    //
    // Herda a idempotência do `SET NX` lá em cima: reentrega do Asaas sai por
    // `'repetido'` e não chega aqui. Importa porque o GA4 deduplica por
    // `transaction_id` mas não some com o evento repetido no mesmo instante —
    // e uma venda contada duas vezes na receita é pior que não contada.
    await avisarGa4(params).catch((err) => {
      log.warn('purchase do GA4 nao saiu', { pedido: params.numeroPedido, erro: String(err) });
    });
  }

  return 'registrado';
}

/**
 * Manda pro GA4 o evento que faz a venda aparecer na receita.
 *
 * O `pedido_registrado` do navegador leva `value` e `items` e o GA4 guarda —
 * mas `purchaseRevenue` fica em zero e o público "Purchasers" fica vazio,
 * porque só nome PADRÃO da especificação alimenta relatório de e-commerce.
 * Detalhe do porquê em `@/lib/analytics/ga4-servidor`.
 */
async function avisarGa4(params: {
  numeroPedido: string;
  valorCentavos: number;
  parcelamento?: { id: string; totalCentavos: number; parcelas: number } | null;
}): Promise<void> {
  const pedido = await consultarPedido(params.numeroPedido);
  if (!pedido) {
    // Webhook de um número que não está na nossa tabela. Sem itens e sem
    // total, mandar `purchase` seria inventar uma venda no relatório.
    log.info('sem pedido pra montar o purchase do GA4', { pedido: params.numeroPedido });
    return;
  }

  const items: ItemGa4[] = pedido.itens.map((i) => ({
    // MESMO formato que o navegador usa no `pedido_registrado` — `item_id` é o
    // modelo (MB-04), `item_name` é "Master Block MB-04". Divergir aqui
    // quebraria o relatório de item em dois: metade por modelo, metade pela
    // descrição do quadro, e some a visão de QUAL modelo vende.
    item_id: i.modelo ?? i.descricao,
    item_name: i.modelo ? `Master Block ${i.modelo}` : i.descricao,
    quantity: i.quantidade,
    price: i.precoCentavos / 100,
  }));

  // O TOTAL do pedido, não o valor do evento.
  //
  // Parcelado, o Asaas manda um evento por parcela: contar `payment.value`
  // registraria R$ 725 numa venda de R$ 4.350. E o total do pedido é também o
  // que o navegador mandou no `pedido_registrado` — os dois têm que bater, ou
  // a mesma venda aparece com dois valores.
  const valorCentavos =
    pedido.totalCentavos || params.parcelamento?.totalCentavos || params.valorCentavos;

  await enviarPurchaseGa4({ numeroPedido: params.numeroPedido, valorCentavos, items });
}

/**
 * Escreve pro comprador dizendo que o dinheiro entrou.
 *
 * Mora aqui dentro, depois do `SET NX`, por um motivo concreto: naquele ponto a
 * reentrega do Asaas já saiu pela porta do `'repetido'`. Ou seja, este e-mail
 * herda a idempotência de graça — sem ela, um pagamento reentregue viraria dois
 * e-mails idênticos na caixa do cliente.
 *
 * Nada aqui pode derrubar o webhook: quem chama engole a exceção. Um erro neste
 * ponto significaria devolver não-2xx pro Asaas, que reentregaria o evento —
 * mas a chave de idempotência JÁ está gravada, então a reentrega sairia pelo
 * `'repetido'` e o pagamento ficaria sem registro nenhum. Falha de e-mail não
 * pode custar isso.
 */
async function avisarCliente(params: {
  eventoId: string;
  numeroPedido: string;
  valorCentavos: number;
}): Promise<void> {
  const contato = await contatoDoPedido(params.numeroPedido);

  // ⚠️ OS TRÊS MOTIVOS DE NÃO SAIR E-MAIL SÃO SEPARADOS DE PROPÓSITO.
  //
  // O Sentry agrupa por mensagem: frase igual = mesma issue. Enquanto os três
  // dividiam a mesma linha, o caso grave nascia dentro de uma issue já cheia de
  // ruído de teste e já descartada por quem olhou. Achado na primeira triagem,
  // em 09/09 (SOMATEC-WEB-4, 5 eventos, todos `SB-TESTE-PARC-C`).
  //
  //   pedido não existe aqui  → warn   · webhook de teste ou de outro sistema
  //   janela de silêncio      → info   · decisão de projeto, está certo
  //   existe e SEM e-mail     → error  · alguém pagou e não vai receber nada

  // Webhook para um número que não está na nossa tabela. Não é bom sinal, mas
  // também não é alguém sem resposta: não há ninguém. Fica em `warn`.
  if (!contato) {
    log.warn('pagamento de pedido que nao existe aqui — nada a avisar', {
      pedido: params.numeroPedido,
    });
    return;
  }

  // A janela de silêncio: no cartão a confirmação chega segundos depois do
  // e-mail de pedido, e dois e-mails quase iguais em um minuto ensinam a pessoa
  // a ignorar o remetente logo antes da fase em que ela precisa abrir (o
  // rastreio). A regra mora no módulo do e-mail, num lugar só.
  //
  // Vem ANTES da checagem de e-mail de propósito: aqui a gente não ia mandar de
  // qualquer jeito, então faltar e-mail não é falha nenhuma.
  if (!deveAvisarPagamento({ criadoEm: contato.criadoEm })) {
    log.info('confirmacao logo apos o pedido — cliente nao avisado de novo', {
      pedido: params.numeroPedido,
    });
    return;
  }

  // 🔴 Aqui sim: o pedido existe, a gente QUERIA mandar, e não tem para onde.
  // É o caso do cliente que pagou e não vai receber nada — o silêncio que vira
  // mensagem no WhatsApp perguntando se o dinheiro entrou.
  if (!contato.email) {
    log.error('pedido sem e-mail — quem pagou nao vai receber aviso', {
      pedido: params.numeroPedido,
    });
    return;
  }

  const dados = {
    numero: params.numeroPedido,
    primeiroNome: contato.primeiroNome,
    valorCentavos: params.valorCentavos,
    formaPagamento: contato.formaPagamento,
  };

  await enviarEmail({
    para: contato.email,
    assunto: assuntoPagamento(params.numeroPedido),
    html: htmlPagamento(dados),
    texto: textoPagamento(dados),
    marcador: `pagamento-cliente:${params.eventoId}`,
  });
}
