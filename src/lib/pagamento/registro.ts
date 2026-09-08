import 'server-only';
import { getRedis } from '@/lib/redis';
import { createLogger } from '@/lib/logger';
import { enviarEmail } from '@/lib/email/enviar';
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
  const valor = (params.valorCentavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const pago = params.situacao === 'pago';
  await enviarEmail({
    para: CONTACT.email,
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

  return 'registrado';
}
