import 'server-only';
import { randomUUID } from 'node:crypto';
import type { MullerBotPayload } from '@/lib/mullerbot/payload';
import { sendToBetinna } from '@/lib/betinna/client';
import { enqueueSubmission, markSent, markAttempt } from '@/lib/webhook-queue';
import { createLogger } from '@/lib/logger';

const log = createLogger('entregar-lead');

// =============================================================================
// Entrega do lead ao CRM — com rede embaixo.
//
// Enfileira PRIMEIRO, tenta mandar DEPOIS. Se a tentativa falhar, a linha fica
// na fila e o cron `process-webhook-queue` retenta com backoff. É essa ordem
// que faz a diferença: mandar direto e só enfileirar no erro perderia o lead
// quando o próprio processo cai no meio.
//
// Existe porque o pedido do checkout fazia isto pelo NAVEGADOR, numa segunda
// chamada depois de `/api/pedidos` já ter dado 201. Se ela falhasse — captcha,
// rede, aba fechada — o pedido existia e o lead não, sem nada acusar: o
// cliente via "pedido confirmado" e o CRM não sabia de nada.
//
// Um lead que não chega não é só um registro faltando. É o fluxo que não roda,
// a confirmação que não sai no WhatsApp, a tarefa de conferir pagamento que
// não nasce, e quem comprou seguindo marcado como abandono na régua de
// recuperação.
// =============================================================================

export type ResultadoEntrega = 'enviado' | 'na_fila' | 'nao_enfileirado';

export async function entregarLead(
  payload: MullerBotPayload,
  contexto: { sourcePage: string | null; sourceIp: string },
): Promise<ResultadoEntrega> {
  const idempotencyKey = randomUUID();

  try {
    await enqueueSubmission({
      idempotencyKey,
      payload,
      sourcePage: contexto.sourcePage,
      sourceIp: contexto.sourceIp,
    });
  } catch (err) {
    // Sem fila não há rede: o envio abaixo vira tentativa única. Vale tentar
    // assim mesmo — melhor um lead entregue sem rastro que nenhum lead.
    log.error('nao consegui enfileirar o lead', undefined, err);
    const solto = await sendToBetinna(payload);
    return solto.result === 'sent' ? 'enviado' : 'nao_enfileirado';
  }

  const r = await sendToBetinna(payload);
  if (r.result === 'sent') {
    await markSent(idempotencyKey, r.status, r.externalId ?? null);
    return 'enviado';
  }

  await markAttempt(idempotencyKey, r, 0);
  return 'na_fila';
}
