import 'server-only';
import Redis from 'ioredis';
import { createLogger } from '@/lib/logger';

/**
 * Cliente Redis único (ioredis) — usado por rate-limit e idempotência.
 * Lê `REDIS_URL` (Redis nativo do Railway, TCP). Se ausente ou com erro,
 * retorna null → tudo que depende dele roda em fail-open (não trava o site).
 */

const log = createLogger('redis');

// Guarda no globalThis para não abrir várias conexões no HMR do dev.
const g = globalThis as unknown as { __somatecRedis?: Redis | null };

export function getRedis(): Redis | null {
  if (g.__somatecRedis !== undefined) return g.__somatecRedis;

  const url = process.env.REDIS_URL;
  if (!url) {
    log.warn('REDIS_URL ausente — Redis desativado (rate-limit/idempotência em fail-open)');
    g.__somatecRedis = null;
    return null;
  }

  try {
    const client = new Redis(url, {
      // Railway usa rede privada IPv6 (redis.railway.internal). family:0 deixa
      // o DNS resolver IPv4+IPv6 — sem isso o ioredis só tenta IPv4 e falha
      // com "Stream isn't writeable".
      family: 0,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false, // falha rápido em vez de enfileirar → fail-open
      connectTimeout: 5000,
      lazyConnect: false,
    });
    // Evita que um erro de conexão vire "unhandled error" e derrube o processo.
    client.on('error', (err) => log.warn('redis connection error', undefined, err));
    g.__somatecRedis = client;
    return client;
  } catch (err) {
    log.warn('redis init falhou (fail-open)', undefined, err);
    g.__somatecRedis = null;
    return null;
  }
}
