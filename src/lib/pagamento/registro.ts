import 'server-only';
import { getRedis } from '@/lib/redis';
import { createLogger } from '@/lib/logger';
import { enviarEmail } from '@/lib/email/enviar';
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
}): Promise<EfeitoRegistro> {
  const chave = `somatec:pagamento:${params.eventoId}`;
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
  const valor = (params.valorCentavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const pago = params.situacao === 'pago';
  await enviarEmail({
    para: destino,
    assunto: pago
      ? `Pagamento confirmado — pedido ${params.numeroPedido} (${valor})`
      : `Pagamento NÃO concluído — pedido ${params.numeroPedido}`,
    html: pago
      ? `<p>O pedido <strong>${params.numeroPedido}</strong> foi pago: <strong>${valor}</strong>.</p>
         <p>Evento do gateway: ${params.evento}${params.cobrancaId ? ` · cobrança ${params.cobrancaId}` : ''}.</p>
         <p>Pode seguir com a separação e o faturamento.</p>`
      : `<p>O pagamento do pedido <strong>${params.numeroPedido}</strong> não se concretizou (${params.evento}).</p>
         <p>Vale confirmar com o cliente antes de separar.</p>`,
    texto: pago
      ? `Pedido ${params.numeroPedido} pago (${valor}). Evento ${params.evento}.`
      : `Pedido ${params.numeroPedido}: pagamento não concluído (${params.evento}).`,
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
    await avisarCliente(params).catch((err) => {
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

  // Sem e-mail não há o que fazer, mas isso NÃO é rotina: em produção significa
  // que o pedido sumiu da tabela ou que a chave perdeu poder de leitura. Fica
  // como erro pra aparecer no Sentry — cliente que pagou e não recebeu nada é
  // exatamente o silêncio que vira mensagem no WhatsApp.
  if (!contato) {
    log.error('sem contato do pedido — cliente nao avisado', { pedido: params.numeroPedido });
    return;
  }

  // A janela de silêncio: no cartão a confirmação chega segundos depois do
  // e-mail de pedido, e dois e-mails quase iguais em um minuto ensinam a pessoa
  // a ignorar o remetente logo antes da fase em que ela precisa abrir (o
  // rastreio). A regra mora no módulo do e-mail, num lugar só.
  if (!deveAvisarPagamento({ criadoEm: contato.criadoEm })) {
    log.info('confirmacao logo apos o pedido — cliente nao avisado de novo', {
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
