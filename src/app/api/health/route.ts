import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { publicResponseHeaders, corsHeaders } from '@/lib/http/headers';
import { getRedis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckStatus = 'ok' | 'degraded' | 'down' | 'skipped';
type Check = { status: CheckStatus; latency_ms?: number; message?: string };

type QueueStats = {
  pending: number;
  failed: number;
  dead: number;
  oldest_pending_age_seconds: number | null;
};

function hasValidSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') && url.includes('.supabase.');
}

async function checkSupabase(): Promise<Check> {
  if (!hasValidSupabaseConfig()) {
    return { status: 'down', message: 'NEXT_PUBLIC_SUPABASE_URL inválido' };
  }
  const start = Date.now();
  try {
    const db = getSupabaseAdminClient();
    const { error } = await db.from('site_settings').select('key').limit(1);
    const latency_ms = Date.now() - start;
    if (error) return { status: 'down', latency_ms, message: error.message };
    return { status: 'ok', latency_ms };
  } catch (e) {
    return { status: 'down', latency_ms: Date.now() - start, message: e instanceof Error ? e.message : 'unknown' };
  }
}

async function checkRedis(): Promise<Check> {
  const redis = getRedis();
  if (!redis) return { status: 'skipped', message: 'REDIS_URL não configurado' };
  const start = Date.now();
  try {
    const pong = await redis.ping();
    const latency_ms = Date.now() - start;
    if (pong !== 'PONG') return { status: 'down', latency_ms, message: `resposta inesperada: ${pong}` };
    return { status: 'ok', latency_ms };
  } catch (e) {
    return { status: 'down', latency_ms: Date.now() - start, message: e instanceof Error ? e.message : 'unknown' };
  }
}

function checkEnv(): Check {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) return { status: 'down', message: `faltando: ${missing.join(', ')}` };
  return { status: 'ok' };
}

function checkSentry(): Check {
  return process.env.SENTRY_DSN
    ? { status: 'ok', message: 'configurado' }
    : { status: 'skipped', message: 'SENTRY_DSN não configurado (errors não vão pro Sentry)' };
}

function checkBetinna(): Check {
  const ok = Boolean(process.env.BETINNA_LEADS_URL && process.env.BETINNA_API_KEY);
  return ok
    ? { status: 'ok', message: 'webhook de leads (Betinna) configurado' }
    : { status: 'degraded', message: 'BETINNA_* ausente — forms ficam empilhados em pending' };
}

async function getQueueStats(): Promise<QueueStats | null> {
  if (!hasValidSupabaseConfig()) return null;
  try {
    const db = getSupabaseAdminClient();
    const [byStatus, oldestPending] = await Promise.all([
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
    const oldest = (oldestPending.data as { next_attempt_at: string } | null)?.next_attempt_at ?? null;

    const oldest_pending_age_seconds = oldest
      ? Math.max(0, Math.floor((Date.now() - new Date(oldest).getTime()) / 1000))
      : null;

    return {
      pending: rows.filter((r) => r.status === 'pending').length,
      failed: rows.filter((r) => r.status === 'failed').length,
      dead: rows.filter((r) => r.status === 'dead').length,
      oldest_pending_age_seconds,
    };
  } catch {
    return null;
  }
}

function classifyQueue(stats: QueueStats | null): Check {
  if (!stats) return { status: 'skipped', message: 'queue indisponível (Supabase down)' };

  // dead acumulando: degraded
  // oldest pending muito antigo (>1h): degraded (cron pode estar parado)
  const oneHour = 3600;
  if (stats.oldest_pending_age_seconds !== null && stats.oldest_pending_age_seconds > oneHour) {
    return {
      status: 'degraded',
      message: `pending há ${stats.oldest_pending_age_seconds}s (cron pode estar parado)`,
    };
  }
  if (stats.dead > 0 && stats.dead >= 10) {
    return { status: 'degraded', message: `${stats.dead} mensagens dead — investigar` };
  }
  return { status: 'ok', message: `${stats.pending} pending, ${stats.failed} failed, ${stats.dead} dead` };
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const env = checkEnv();
  const sentry = checkSentry();
  const betinna = checkBetinna();
  const [supabase, redis, queueStats] = await Promise.all([
    checkSupabase(),
    checkRedis(),
    getQueueStats(),
  ]);
  const queue = classifyQueue(queueStats);

  const critical: Check[] = [env, supabase];
  const overall: CheckStatus = critical.some((c) => c.status === 'down')
    ? 'down'
    : [redis, queue, betinna].some((c) => c.status === 'down' || c.status === 'degraded')
      ? 'degraded'
      : 'ok';

  const status = overall === 'down' ? 503 : 200;
  const origin = req.headers.get('origin');

  return NextResponse.json(
    {
      status: overall,
      total_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
      checks: { env, supabase, redis, betinna, queue, sentry },
      queue_stats: queueStats,
    },
    { status, headers: publicResponseHeaders(origin) },
  );
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin'), { methods: 'GET, OPTIONS' }),
  });
}
