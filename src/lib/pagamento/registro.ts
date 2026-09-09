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
import { contatoDoPedido } from '@/lib/pedidos/servidor';
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
  }

  return 'registrado';
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
