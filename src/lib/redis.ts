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
const g = globalThis as unknown as { __somatecRedis?: Redis | null; __somatecRedisEm?: number };

/** Há quantos segundos este cliente foi criado, ou `null` se não há cliente.
 *
 *  Existe por causa do aquecimento: com `enableOfflineQueue: false`, os
 *  primeiros instantes depois de criar o cliente devolvem "Stream isn't
 *  writeable" — que NÃO é o Redis caído, é a conexão que ainda não subiu.
 *
 *  O relógio tem que ser este, e não o do processo: o cliente nasce na
 *  primeira chamada que precisa dele, o que pode ser minutos depois do boot,
 *  quando chega o primeiro tráfego. Medir pelo uptime do processo acerta por
 *  coincidência quando a primeira visita vem logo, e erra o resto do tempo. */
export function idadeDoRedisS(): number | null {
  if (!g.__somatecRedis || g.__somatecRedisEm === undefined) return null;
  return Math.round((Date.now() - g.__somatecRedisEm) / 1000);
}

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
    g.__somatecRedisEm = Date.now();
    return client;
  } catch (err) {
    log.warn('redis init falhou (fail-open)', undefined, err);
    g.__somatecRedis = null;
    return null;
  }
}
