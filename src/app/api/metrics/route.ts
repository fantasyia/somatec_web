import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  setGauge,
  renderPrometheus,
} from '@/lib/metrics/registry';
import { createLogger } from '@/lib/logger';
import { validateBearer } from '@/lib/auth/bearer';
import { apiVersionHeaders } from '@/lib/http/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = createLogger('metrics');
const STARTED_AT_MS = Date.now();

const METADATA = {
  msm_uptime_seconds: { help: 'Tempo decorrido desde o start do worker em segundos.', type: 'gauge' as const },
  msm_build_info: { help: 'Info do build (release SHA, env).', type: 'gauge' as const },
  msm_queue_pending: { help: 'Mensagens em pending na webhook_retry_queue.', type: 'gauge' as const },
  msm_queue_failed: { help: 'Mensagens em failed (vão tentar novamente).', type: 'gauge' as const },
  msm_queue_dead: { help: 'Mensagens dead (excederam max_attempts ou 4xx).', type: 'gauge' as const },
  msm_queue_oldest_pending_seconds: { help: 'Idade da mensagem pending mais antiga.', type: 'gauge' as const },
  msm_http_requests_total: { help: 'Total de HTTP requests por rota/status.', type: 'counter' as const },
  msm_operation_duration_ms: { help: 'Duração de operações instrumentadas (queue, mullerbot, etc).', type: 'histogram' as const },
  msm_errors_total: { help: 'Total de erros loggados (log.error chamadas), agrupados por scope.', type: 'counter' as const },
  msm_csp_violations_total: { help: 'Total de violações CSP reportadas pelo browser, agrupadas por directive.', type: 'counter' as const },
  msm_alerts_total: { help: 'Total de alertas avaliados pelo health monitor, por severity e key.', type: 'counter' as const },
  msm_audit_archive_deleted_total: { help: 'Total de registros admin_activity_log apagados pelo cron de archive.', type: 'counter' as const },
  msm_audit_log_rows: { help: 'Total atual de registros em admin_activity_log.', type: 'gauge' as const },
  msm_slow_operations_total: { help: 'Operações withTiming acima de SLOW_QUERY_MS (default 500ms).', type: 'counter' as const },
  msm_critical_operations_total: { help: 'Operações withTiming acima de CRITICAL_QUERY_MS (default 5000ms).', type: 'counter' as const },
  msm_queue_processed_total: { help: 'Total de mensagens processadas pelo cron process-webhook-queue, agrupadas por outcome (sent/client_error/server_error/network_error/not_configured).', type: 'counter' as const },
  msm_webhook_callbacks_total: { help: 'Total de callbacks recebidos em /api/webhooks/mullerbot, agrupados por validade da signature.', type: 'counter' as const },
  msm_webhook_callbacks_ingest_total: { help: 'Outcome do ingest de callbacks (inserted/duplicate/error) por event_type.', type: 'counter' as const },
};

function hasValidSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') && url.includes('.supabase.');
}

async function refreshQueueStats(): Promise<void> {
  if (!hasValidSupabaseConfig()) return;
  try {
    const db = getSupabaseAdminClient();
    const [byStatus, oldest] = await Promise.all([
      db.from('webhook_retry_queue').select('status').in('status', ['pending', 'failed', 'dead']),
      db
        .from('webhook_retry_queue')
        .select('next_attempt_at')
        .eq('status', 'pending')
        .order('next_attempt_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);
    const rows = (byStatus.data ?? []) as { status: string }[];
    setGauge('msm_queue_pending', rows.filter((r) => r.status === 'pending').length);
    setGauge('msm_queue_failed', rows.filter((r) => r.status === 'failed').length);
    setGauge('msm_queue_dead', rows.filter((r) => r.status === 'dead').length);
    const oldestTs = (oldest.data as { next_attempt_at: string } | null)?.next_attempt_at ?? null;
    setGauge(
      'msm_queue_oldest_pending_seconds',
      oldestTs ? Math.max(0, Math.floor((Date.now() - new Date(oldestTs).getTime()) / 1000)) : 0,
    );
  } catch (err) {
    log.warn('refreshQueueStats failed', undefined, err);
  }
}

function refreshStaticGauges(): void {
  setGauge('msm_uptime_seconds', Math.floor((Date.now() - STARTED_AT_MS) / 1000));
  setGauge(
    'msm_build_info',
    1,
    {
      release: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      env: process.env.NODE_ENV ?? 'unknown',
      next_version: '16.2.6',
    },
  );
}

export async function GET(req: NextRequest) {
  // Auth: em produção, METRICS_SECRET é OBRIGATÓRIO (fail-closed) — sem ele o
  // endpoint não vaza telemetria. Em dev/test sem secret, segue aberto. Rotação CSV.
  const check = validateBearer(req.headers.get('authorization'), 'METRICS_SECRET', {
    requireInProduction: true,
  });
  if (!check.ok) {
    if (check.reason === 'missing_secret') {
      log.error('metrics: METRICS_SECRET não configurado em produção');
      return NextResponse.json({ error: 'config_missing' }, { status: 500 });
    }
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  refreshStaticGauges();
  await refreshQueueStats();

  const body = renderPrometheus(METADATA);

  return new NextResponse(body, {
    status: 200,
    headers: {
      // version 0.0.4 da spec Prometheus exposition format
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...apiVersionHeaders(),
    },
  });
}
