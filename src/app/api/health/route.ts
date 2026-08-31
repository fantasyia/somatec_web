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

// =============================================================================
// RASTRO DOS DEGRADES
//
// Cada chamada aqui é um retrato do instante. Um degrade que passa em dois
// minutos some sem deixar nada, e depois ninguém consegue responder "o que
// estava ruim ontem à noite?" — foi exatamente o que aconteceu em 30/08.
//
// O lugar natural disso seria o Sentry, que está desligado por decisão (não é
// hora ainda). Enquanto não for, o endpoint guarda o próprio rastro.
//
// ⚠️ Vive na MEMÓRIA do processo: reinício ou deploy zera, e cada instância
// tem o seu. Não é auditoria — é o suficiente pra investigar um flap recente,
// que é o caso que hoje fica sem resposta nenhuma. Por isso o `desde` vai
// junto: sem ele, uma lista vazia depois de um restart pareceria "nunca
// degradou", que é a leitura errada.
// =============================================================================

type EventoDegrade = {
  quando: string;
  status: CheckStatus;
  /** Só o que estava ruim — o que estava ok não ajuda a investigar. */
  ruins: { check: string; status: CheckStatus; message?: string }[];
};

const MAX_EVENTOS = 8;
const historico: EventoDegrade[] = [];
let assinaturaAnterior = '';
let processoDesde: string | null = null;

/** Registra MUDANÇA de estado, não amostra.
 *
 *  O monitoramento bate aqui de minuto em minuto; gravar toda chamada encheria
 *  a lista com o mesmo degrade repetido e esconderia justamente o que interessa
 *  — quando começou e quando voltou. */
function registrarMudanca(overall: CheckStatus, checks: Record<string, Check>) {
  const ruins = Object.entries(checks)
    .filter(([, c]) => c.status === 'down' || c.status === 'degraded')
    .map(([check, c]) => ({ check, status: c.status, ...(c.message ? { message: c.message } : {}) }));

  const assinatura = `${overall}|${ruins.map((r) => `${r.check}:${r.status}`).join(',')}`;
  if (assinatura === assinaturaAnterior) return;

  // A volta pro normal também é evento: é o que fecha a janela do incidente.
  if (assinaturaAnterior !== '' || ruins.length > 0) {
    historico.unshift({ quando: new Date().toISOString(), status: overall, ruins });
    if (historico.length > MAX_EVENTOS) historico.length = MAX_EVENTOS;
  }
  assinaturaAnterior = assinatura;
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  processoDesde ??= new Date().toISOString();
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

  const checks = { env, supabase, redis, betinna, queue, sentry };
  registrarMudanca(overall, checks);

  const status = overall === 'down' ? 503 : 200;
  const origin = req.headers.get('origin');

  return NextResponse.json(
    {
      status: overall,
      total_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
      checks,
      queue_stats: queueStats,
      // `desde` diz até onde a memória alcança: lista vazia com `desde` de
      // agora significa "acabou de subir", não "está tudo bem faz tempo".
      degrades_recentes: { desde: processoDesde, eventos: historico },
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
