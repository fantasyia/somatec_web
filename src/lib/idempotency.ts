import 'server-only';
import { getRedis } from '@/lib/redis';
import { createLogger } from '@/lib/logger';

const log = createLogger('idempotency');

// TTL da resposta cacheada: 24h cobre retries normais e proxy CDN replay.
const TTL_SECONDS = 24 * 60 * 60;
// TTL da sentinela in-flight: curto, para liberar a chave se o handler morrer
// antes de gravar a resposta (evita travar retries legítimos por 24h).
const INFLIGHT_TTL_SECONDS = 60;
const KEY_PREFIX = 'somatec:idem';

const SENTINEL = '__inflight__';

type CachedResponse = {
  status: number;
  body: string;
  contentType: string;
};

export type IdempotencyResult =
  | { mode: 'skipped' } // Redis não configurado / erro → fail-open
  | { mode: 'first' } // primeira vez (reservou a chave), prossegue
  | { mode: 'in_flight' } // outra requisição com a mesma chave ainda processando
  | { mode: 'replay'; response: CachedResponse }; // já concluída, retorna cache

/**
 * Olha se a chave foi usada antes. Se sim, devolve a resposta cacheada.
 * Se não, marca a chave como "in-flight" (caller deve chamar storeResponse).
 *
 * Header HTTP: `Idempotency-Key` (RFC draft, em uso por Stripe/Square/etc).
 */
export async function checkIdempotency(key: string): Promise<IdempotencyResult> {
  const redis = getRedis();
  if (!redis) return { mode: 'skipped' };
  const k = `${KEY_PREFIX}:${key}`;

  try {
    // Reserva ATÔMICA: SET NX só grava se a chave não existir. Evita que duas
    // requisições concorrentes com a mesma chave processem em duplicidade.
    const reserved = await redis.set(k, SENTINEL, 'EX', INFLIGHT_TTL_SECONDS, 'NX');
    if (reserved === 'OK') return { mode: 'first' };

    const existing = await redis.get(k);
    if (!existing) return { mode: 'first' }; // expirou entre SET e GET (raro)
    if (existing === SENTINEL) return { mode: 'in_flight' };
    try {
      return { mode: 'replay', response: JSON.parse(existing) as CachedResponse };
    } catch {
      return { mode: 'first' };
    }
  } catch (err) {
    log.warn('checkIdempotency error (fallback: prosseguir)', { key }, err);
    return { mode: 'skipped' };
  }
}

/** Armazena a resposta para responder o mesmo se a chave for repetida. */
export async function storeResponse(key: string, response: CachedResponse): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`${KEY_PREFIX}:${key}`, JSON.stringify(response), 'EX', TTL_SECONDS);
  } catch (err) {
    log.warn('storeResponse error', { key }, err);
  }
}

/**
 * Valida formato da chave: UUID ou identificador ASCII safe entre 8 e 128 chars.
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  if (key.length < 8 || key.length > 128) return false;
  return /^[A-Za-z0-9_\-:.]+$/.test(key);
}
