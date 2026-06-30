import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { incrementCounter } from '@/lib/metrics/registry';
import { formatWebhookPayload, getFormat } from './formatters';

const log = createLogger('health-monitor');

// =============================================================================
// Health monitor — avalia condições de saúde e envia alertas para um webhook
// configurável. Roda como cron job (a cada 5min recomendado).
//
// Anti-spam: cada (alert_key, hora-do-dia) é alertado no máximo 1x via Redis.
// Sem Redis, o alerta dispara em toda execução — operador deve garantir cron
// próprio é desligado quando manualmente, ou Redis deve estar disponível.
// =============================================================================

export type AlertSeverity = 'warning' | 'critical';

export type Alert = {
  key: string; // identificador único do tipo de alerta (e.g. 'queue.dead.high')
  severity: AlertSeverity;
  title: string;
  message: string;
  context?: Record<string, unknown>;
};

export type MonitorResult = {
  checked_at: string;
  evaluations: number;
  alerts_fired: Alert[];
  alerts_suppressed: number; // por dedup
  webhook_sent: boolean;
  webhook_error?: string;
};

// -----------------------------------------------------------------------------
// Thresholds (sobrescrevíveis via env)
// -----------------------------------------------------------------------------

function num(envVar: string, fallback: number): number {
  const v = process.env[envVar];
  if (!v) return fallback;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const THRESHOLDS = {
  queueDeadCritical: num('ALERT_QUEUE_DEAD_CRITICAL', 50),
  queueDeadWarning: num('ALERT_QUEUE_DEAD_WARNING', 10),
  queueOldestPendingCriticalSec: num('ALERT_QUEUE_OLDEST_CRITICAL_SEC', 3600), // 1h
  queueOldestPendingWarningSec: num('ALERT_QUEUE_OLDEST_WARNING_SEC', 900), // 15min
  supabaseLatencyWarningMs: num('ALERT_SUPABASE_LATENCY_WARN_MS', 3000),
};

// -----------------------------------------------------------------------------
// Coleta de métricas (mesmas do /api/health, isoladas para teste)
// -----------------------------------------------------------------------------

export type QueueStats = {
  pending: number;
  failed: number;
  dead: number;
  oldest_pending_age_seconds: number | null;
};

export async function collectQueueStats(): Promise<QueueStats | null> {
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
    const oldestTs = (oldest.data as { next_attempt_at: string } | null)?.next_attempt_at ?? null;
    return {
      pending: rows.filter((r) => r.status === 'pending').length,
      failed: rows.filter((r) => r.status === 'failed').length,
      dead: rows.filter((r) => r.status === 'dead').length,
      oldest_pending_age_seconds: oldestTs
        ? Math.max(0, Math.floor((Date.now() - new Date(oldestTs).getTime()) / 1000))
        : null,
    };
  } catch (err) {
    log.warn('collectQueueStats failed', undefined, err);
    return null;
  }
}

export type SupabaseProbe = {
  ok: boolean;
  latency_ms: number;
  error?: string;
};

export async function probeSupabase(): Promise<SupabaseProbe> {
  const start = Date.now();
  try {
    const db = getSupabaseAdminClient();
    const { error } = await db.from('site_settings').select('key').limit(1);
    const latency_ms = Date.now() - start;
    return { ok: !error, latency_ms, error: error?.message };
  } catch (err) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

// -----------------------------------------------------------------------------
// Avaliação de thresholds
// -----------------------------------------------------------------------------

export function evaluateAlerts(input: {
  queue: QueueStats | null;
  supabase: SupabaseProbe;
}): Alert[] {
  const alerts: Alert[] = [];

  if (!input.supabase.ok) {
    alerts.push({
      key: 'supabase.down',
      severity: 'critical',
      title: 'Supabase indisponível',
      message: `Probe falhou em ${input.supabase.latency_ms}ms: ${input.supabase.error ?? 'sem detalhes'}`,
      context: { latency_ms: input.supabase.latency_ms, error: input.supabase.error },
    });
  } else if (input.supabase.latency_ms > THRESHOLDS.supabaseLatencyWarningMs) {
    alerts.push({
      key: 'supabase.slow',
      severity: 'warning',
      title: 'Supabase lento',
      message: `Probe em ${input.supabase.latency_ms}ms (threshold: ${THRESHOLDS.supabaseLatencyWarningMs}ms)`,
      context: { latency_ms: input.supabase.latency_ms },
    });
  }

  if (input.queue) {
    if (input.queue.dead >= THRESHOLDS.queueDeadCritical) {
      alerts.push({
        key: 'queue.dead.critical',
        severity: 'critical',
        title: 'Webhook queue: muitas mensagens dead',
        message: `${input.queue.dead} mensagens em status 'dead' (threshold crítico: ${THRESHOLDS.queueDeadCritical}). Investigar MullerBot.`,
        context: { dead: input.queue.dead },
      });
    } else if (input.queue.dead >= THRESHOLDS.queueDeadWarning) {
      alerts.push({
        key: 'queue.dead.warning',
        severity: 'warning',
        title: 'Webhook queue: dead acumulando',
        message: `${input.queue.dead} mensagens dead (threshold: ${THRESHOLDS.queueDeadWarning}).`,
        context: { dead: input.queue.dead },
      });
    }

    const oldest = input.queue.oldest_pending_age_seconds;
    if (oldest !== null) {
      if (oldest >= THRESHOLDS.queueOldestPendingCriticalSec) {
        alerts.push({
          key: 'queue.cron.stuck',
          severity: 'critical',
          title: 'Cron de webhook queue pode estar parado',
          message: `Mensagem pending há ${oldest}s (threshold crítico: ${THRESHOLDS.queueOldestPendingCriticalSec}s). Verificar cron.`,
          context: { oldest_pending_age_seconds: oldest },
        });
      } else if (oldest >= THRESHOLDS.queueOldestPendingWarningSec) {
        alerts.push({
          key: 'queue.pending.aging',
          severity: 'warning',
          title: 'Webhook queue: pending envelhecendo',
          message: `Mensagem pending há ${oldest}s.`,
          context: { oldest_pending_age_seconds: oldest },
        });
      }
    }
  }

  return alerts;
}

// -----------------------------------------------------------------------------
// Dedup via Redis (Upstash REST, sem dep)
// -----------------------------------------------------------------------------

function dedupKey(alertKey: string): string {
  // 1 alerta por (key, hora do dia) para evitar spam
  const hour = new Date().toISOString().slice(0, 13); // 2026-05-17T17
  return `msm:alert:${alertKey}:${hour}`;
}

async function shouldFire(alertKey: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return true; // sem Redis: dispara sempre

  const key = dedupKey(alertKey);
  try {
    // SET key value NX EX 3600 (atomic set if not exists, expira em 1h)
    const res = await fetch(`${url}/set/${encodeURIComponent(key)}/1?nx=true&ex=3600`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return true;
    const json = (await res.json()) as { result: string | null };
    // 'OK' = set foi feito (primeira vez nessa hora). null = chave já existia.
    return json.result === 'OK';
  } catch {
    return true; // fail open: melhor alertar 2x do que perder
  }
}

// -----------------------------------------------------------------------------
// Webhook delivery
// -----------------------------------------------------------------------------

async function sendWebhook(alerts: Alert[]): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.HEALTH_WEBHOOK_URL;
  if (!url) return { ok: false, error: 'HEALTH_WEBHOOK_URL not configured' };

  const payload = formatWebhookPayload(getFormat(), {
    alerts,
    environment: process.env.NODE_ENV ?? 'unknown',
    timestamp: new Date().toISOString(),
  });

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.HEALTH_WEBHOOK_AUTH) {
      headers.Authorization = process.env.HEALTH_WEBHOOK_AUTH;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network error' };
  }
}

// -----------------------------------------------------------------------------
// Entry point — chamada pelo endpoint /api/cron/health-monitor
// -----------------------------------------------------------------------------

export async function runHealthMonitor(): Promise<MonitorResult> {
  const checked_at = new Date().toISOString();
  const [queue, supabase] = await Promise.all([collectQueueStats(), probeSupabase()]);
  const allAlerts = evaluateAlerts({ queue, supabase });

  // Dedup
  const alertsToFire: Alert[] = [];
  let suppressed = 0;
  for (const alert of allAlerts) {
    if (await shouldFire(alert.key)) {
      alertsToFire.push(alert);
    } else {
      suppressed++;
    }
  }

  // Métrica: contar alertas por severity (mesmo suprimidos)
  for (const alert of allAlerts) {
    incrementCounter('msm_alerts_total', { severity: alert.severity, key: alert.key });
  }

  let webhook_sent = false;
  let webhook_error: string | undefined;
  if (alertsToFire.length > 0) {
    const result = await sendWebhook(alertsToFire);
    webhook_sent = result.ok;
    webhook_error = result.error;
    if (!result.ok) {
      log.warn('webhook delivery failed', { error: result.error, count: alertsToFire.length });
    } else {
      log.info('alerts sent', { count: alertsToFire.length });
    }
  }

  return {
    checked_at,
    evaluations: allAlerts.length,
    alerts_fired: alertsToFire,
    alerts_suppressed: suppressed,
    webhook_sent,
    webhook_error,
  };
}
