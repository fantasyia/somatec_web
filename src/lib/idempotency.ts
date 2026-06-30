import 'server-only';
import { Redis } from '@upstash/redis';
import { createLogger } from '@/lib/logger';

const log = createLogger('idempotency');

// TTL da resposta cacheada: 24h cobre retries normais e proxy CDN replay.
const TTL_SECONDS = 24 * 60 * 60;
// TTL da sentinela in-flight: curto, para liberar a chave se o handler morrer
// antes de gravar a resposta (evita travar retries legítimos por 24h).
const INFLIGHT_TTL_SECONDS = 60;
const KEY_PREFIX = 'msm:idem';

let client: Redis | null = null;

function getClient(): Redis | null {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

type CachedResponse = {
  status: number;
  body: string;
  contentType: string;
};

type Sentinel = { __inflight: true };
const SENTINEL: Sentinel = { __inflight: true };

export type IdempotencyResult =
  | { mode: 'skipped' } // Upstash não configurado
  | { mode: 'first' } // primeira vez (reservou a chave), prossegue
  | { mode: 'in_flight' } // outra requisição com a mesma chave ainda processando
  | { mode: 'replay'; response: CachedResponse }; // já concluída, retorna cache

/**
 * Olha se a chave foi usada antes. Se sim, devolve a resposta cacheada.
 * Se não, marca a chave como "in-flight" (caller deve chamar storeResponse).
 *
 * Headers HTTP padrão para isso: `Idempotency-Key` (RFC draft, em uso por Stripe/Square/etc).
 */
export async function checkIdempotency(key: string): Promise<IdempotencyResult> {
  const redis = getClient();
  if (!redis) return { mode: 'skipped' };
  const k = `${KEY_PREFIX}:${key}`;

  try {
    // Reserva ATÔMICA: SET NX só grava se a chave não existir. Sem isso, duas
    // requisições concorrentes com a mesma chave viam ambas 'first' e processavam
    // em duplicidade (dois leads). 'OK' => fomos o primeiro a reservar.
    const reserved = await redis.set(k, SENTINEL, { nx: true, ex: INFLIGHT_TTL_SECONDS });
    if (reserved === 'OK') return { mode: 'first' };
    // Já existe: ou está in-flight (sentinela) ou já tem resposta cacheada.
    const existing = await redis.get<CachedResponse | Sentinel>(k);
    if (existing && (existing as Sentinel).__inflight === true) return { mode: 'in_flight' };
    if (existing) return { mode: 'replay', response: existing as CachedResponse };
    // Expirou entre o SET e o GET (raro) — trata como primeiro.
    return { mode: 'first' };
  } catch (err) {
    log.warn('checkIdempotency error (fallback: prosseguir)', { key }, err);
    return { mode: 'skipped' };
  }
}

/**
 * Armazena a resposta para responder o mesmo se a chave for repetida.
 */
export async function storeResponse(key: string, response: CachedResponse): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(`${KEY_PREFIX}:${key}`, response, { ex: TTL_SECONDS });
  } catch (err) {
    log.warn('storeResponse error', { key }, err);
  }
}

/**
 * Valida formato da chave: UUID ou identificador ASCII safe entre 8 e 128 chars.
 * Rejeita chaves muito curtas (poderiam colidir) ou com caracteres estranhos.
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  if (key.length < 8 || key.length > 128) return false;
  return /^[A-Za-z0-9_\-:.]+$/.test(key);
}
