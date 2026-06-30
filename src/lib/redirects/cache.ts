/**
 * Cache de redirects com 3 camadas:
 *   L1: memória do worker (TTL curto — 10s) — hot path
 *   L2: Redis (Upstash REST) (TTL longo — 1h) — compartilhado entre instâncias
 *   L3: Supabase REST API — fonte de verdade, recarrega quando Redis miss
 *
 * Sem dependência externa (@upstash/redis): usa fetch direto, funciona em
 * Edge Runtime. Reads no middleware → o hot path nunca espera por L2/L3
 * a menos que L1 expire.
 */

export type RedirectEntry = { to_path: string; status_code: number };
export type RedirectMap = Map<string, RedirectEntry>;

const REDIS_KEY = 'msm:redirects:v1';
const MEM_TTL_MS = 10_000; // 10s — propagação rápida sem sobrecarregar Redis
const REDIS_TTL_SEC = 60 * 60; // 1h — Supabase só é consultado em miss completo

// Module-level state (per worker)
let memCache: RedirectMap | null = null;
let memExpiry = 0;

function nowMs(): number {
  return Date.now();
}

async function redisGetJson<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(REDIS_KEY)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result: string | null };
    if (!json.result) return null;
    return JSON.parse(json.result) as T;
  } catch {
    return null;
  }
}

async function redisSetJson(url: string, token: string, value: unknown, ttlSec: number): Promise<void> {
  try {
    const body = encodeURIComponent(JSON.stringify(value));
    await fetch(`${url}/setex/${encodeURIComponent(REDIS_KEY)}/${ttlSec}/${body}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // ignore — cache miss vira fallback Supabase no próximo lookup
  }
}

async function redisDel(url: string, token: string): Promise<void> {
  try {
    await fetch(`${url}/del/${encodeURIComponent(REDIS_KEY)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // ignore
  }
}

type RawRow = { from_path: string; to_path: string; status_code: number };

async function fetchFromSupabase(): Promise<RawRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return [];
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/redirects?active=eq.true&select=from_path,to_path,status_code`,
      {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        signal: AbortSignal.timeout(2000),
      },
    );
    if (!res.ok) return [];
    return (await res.json()) as RawRow[];
  } catch {
    return [];
  }
}

export function rowsToMap(rows: RawRow[]): RedirectMap {
  const map: RedirectMap = new Map();
  for (const row of rows) {
    map.set(row.from_path, { to_path: row.to_path, status_code: row.status_code });
  }
  return map;
}

function mapToRows(map: RedirectMap): RawRow[] {
  const rows: RawRow[] = [];
  for (const [from_path, entry] of map.entries()) {
    rows.push({ from_path, to_path: entry.to_path, status_code: entry.status_code });
  }
  return rows;
}

/**
 * Retorna o map atual de redirects ativos, usando o cache de 3 camadas.
 */
export async function getRedirects(): Promise<RedirectMap> {
  const t = nowMs();
  if (memCache && t < memExpiry) return memCache;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // L2: Redis
  if (redisUrl && redisToken) {
    const cached = await redisGetJson<RawRow[]>(redisUrl, redisToken);
    if (cached) {
      const map = rowsToMap(cached);
      memCache = map;
      memExpiry = t + MEM_TTL_MS;
      return map;
    }
  }

  // L3: Supabase + repopula Redis
  const rows = await fetchFromSupabase();
  const map = rowsToMap(rows);
  memCache = map;
  memExpiry = t + MEM_TTL_MS;

  if (redisUrl && redisToken) {
    await redisSetJson(redisUrl, redisToken, rows, REDIS_TTL_SEC);
  }

  return map;
}

/**
 * Invalida o cache em todas as camadas. Chame após CRUD de redirects no admin.
 * Próximo request faz fallback para Supabase e repopula L2.
 */
export async function invalidateRedirectsCache(): Promise<void> {
  memCache = null;
  memExpiry = 0;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    await redisDel(redisUrl, redisToken);
  }
}

/**
 * Apenas para testes — não use em produção.
 */
export function __resetMemCacheForTests(): void {
  memCache = null;
  memExpiry = 0;
}

export { mapToRows };
