import { NextResponse, type NextRequest } from 'next/server';
import { sendToBetinna } from '@/lib/betinna/client';
import { enviarPedidoBetinna } from '@/lib/betinna/pedidos';
import type { PedidoBetinna } from '@/lib/betinna/pedidos';
import type { MullerBotPayload } from '@/lib/mullerbot/payload';
import {
  fetchDuePending,
  markAttempt,
  markSent,
} from '@/lib/webhook-queue';
import { validateBearer } from '@/lib/auth/bearer';
import { renovarSePerto } from '@/lib/melhorenvio/token';
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

  // Renovação do token do Melhor Envio. Mora aqui porque o risco é o CONTRÁRIO
  // do movimento: 45 dias sem ninguém cotar matam a conexão, e aí só
  // autorização manual no navegador traz de volta. Não pode derrubar a fila.
  let melhorEnvio: string;
  try {
    melhorEnvio = await renovarSePerto();
  } catch {
    melhorEnvio = 'falhou';
  }

  const due = await fetchDuePending(50);
  let processed = 0;
  let sent = 0;
  let failed = 0;
  // Counters por outcome detalhado (sent/client_error/server_error/network_error/not_configured)
  const byOutcome: Record<string, number> = {};
  const byDestino: Record<string, number> = {};

  // Budget de wall-clock: cada envio tem timeout de 8s; 50 linhas numa MullerBot
  // degradada (8s cada) estouraria o tempo do job. Para cedo e deixa o resto pro
  // próximo tick (as linhas não processadas seguem pending/failed com next_attempt_at).
  const startedAt = Date.now();
  const BUDGET_MS = 45_000;

  for (const row of due) {
    if (Date.now() - startedAt > BUDGET_MS) break;
    processed++;
    // A fila carrega dois tipos de entrega. O retry/backoff é o mesmo; quem
    // muda é o destinatário — e o payload de cada um só faz sentido no seu.
    const outcome =
      row.destination === 'betinna-pedido'
        ? await enviarPedidoBetinna(row.payload as PedidoBetinna)
        : await sendToBetinna(row.payload as MullerBotPayload);
    byOutcome[outcome.result] = (byOutcome[outcome.result] ?? 0) + 1;
    // O counter fica SÓ com `outcome`: label novo em série existente quebra
    // painel e alerta que já olham pra ela. O recorte por destino sai no corpo
    // da resposta, logo abaixo, que ninguém consome como métrica.
    incrementCounter('msm_queue_processed_total', { outcome: outcome.result });
    const destino = row.destination ?? 'mullerbot';
    byDestino[destino] = (byDestino[destino] ?? 0) + 1;

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
    melhorEnvio,
    byDestino,
    processed,
    sent,
    failed,
    by_outcome: byOutcome,
    ran_at: new Date().toISOString(),
  });
}
