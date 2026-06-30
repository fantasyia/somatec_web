import { NextResponse, type NextRequest } from 'next/server';
import { sendToMullerBot } from '@/lib/mullerbot/client';
import {
  fetchDuePending,
  markAttempt,
  markSent,
} from '@/lib/webhook-queue';
import { validateBearer } from '@/lib/auth/bearer';
import { incrementCounter } from '@/lib/metrics/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron job: processa fila webhook_retry_queue.
 * Configurar no Railway Cron Jobs (ou qualquer agendador HTTP externo) para
 * chamar este endpoint a cada 5 minutos com header Authorization: Bearer $CRON_SECRET.
 *
 * Autenticação: CRON_SECRET aceita CSV para rotação zero-downtime (ver lib/auth/bearer.ts).
 */
export async function GET(req: NextRequest) {
  const check = validateBearer(req.headers.get('authorization'), 'CRON_SECRET', { requireInProduction: true });
  if (!check.ok) {
    if (check.reason === 'missing_secret') {
      return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const due = await fetchDuePending(50);
  let processed = 0;
  let sent = 0;
  let failed = 0;
  // Counters por outcome detalhado (sent/client_error/server_error/network_error/not_configured)
  const byOutcome: Record<string, number> = {};

  // Budget de wall-clock: cada envio tem timeout de 8s; 50 linhas numa MullerBot
  // degradada (8s cada) estouraria o tempo do job. Para cedo e deixa o resto pro
  // próximo tick (as linhas não processadas seguem pending/failed com next_attempt_at).
  const startedAt = Date.now();
  const BUDGET_MS = 45_000;

  for (const row of due) {
    if (Date.now() - startedAt > BUDGET_MS) break;
    processed++;
    const outcome = await sendToMullerBot(row.payload, row.idempotency_key);
    byOutcome[outcome.result] = (byOutcome[outcome.result] ?? 0) + 1;
    incrementCounter('msm_queue_processed_total', { outcome: outcome.result });

    if (outcome.result === 'sent') {
      await markSent(row.idempotency_key, outcome.status, outcome.externalId ?? null);
      sent++;
    } else {
      await markAttempt(row.idempotency_key, outcome, row.attempts, row.max_attempts);
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    sent,
    failed,
    by_outcome: byOutcome,
    ran_at: new Date().toISOString(),
  });
}
