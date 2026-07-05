import 'server-only';
import { getRedis } from '@/lib/redis';
import { createLogger } from '@/lib/logger';

/**
 * Rate limit por janela fixa (ioredis / Redis do Railway). Substitui o
 * @upstash/ratelimit. Mantém as MESMAS funções e o comportamento fail-open:
 * qualquer erro/ausência de Redis → `mode: 'skipped'` (permite).
 *
 * Nome do arquivo mantido (upstash.ts) para não mexer nos imports existentes.
 */

const log = createLogger('ratelimit');

type LimitResult = { allowed: boolean; remaining: number; reset: number; mode: 'enforced' | 'skipped' };

const SKIP: LimitResult = { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };

// Configuração de cada limite: pontos por janela (segundos) + prefixo da chave.
const LIMITS = {
  forms: { points: 5, windowSec: 60 * 60, prefix: 'somatec:rl:forms' },
  login: { points: 10, windowSec: 15 * 60, prefix: 'somatec:rl:login' },
  loginBurst: { points: 5, windowSec: 60, prefix: 'somatec:rl:login:burst' },
  loginEmail: { points: 5, windowSec: 60 * 60, prefix: 'somatec:rl:login:email' },
} as const;

type LimitName = keyof typeof LIMITS;

/** Consome 1 ponto (janela fixa). INCR + PEXPIRE na primeira ocorrência. */
async function consume(name: LimitName, id: string): Promise<LimitResult> {
  const redis = getRedis();
  if (!redis) return SKIP;
  const { points, windowSec, prefix } = LIMITS[name];
  const key = `${prefix}:${id}`;
  const windowMs = windowSec * 1000;
  try {
    const count = await redis.incr(key);
    let pttl = await redis.pttl(key);
    if (count === 1 || pttl < 0) {
      await redis.pexpire(key, windowMs);
      pttl = windowMs;
    }
    return {
      allowed: count <= points,
      remaining: Math.max(0, points - count),
      reset: Date.now() + pttl,
      mode: 'enforced',
    };
  } catch (err) {
    log.warn(`${name} error (fallback allow)`, undefined, err);
    return SKIP;
  }
}

/** Consulta sem consumir (peek). */
async function peek(name: LimitName, id: string): Promise<LimitResult> {
  const redis = getRedis();
  if (!redis) return SKIP;
  const { points, windowSec, prefix } = LIMITS[name];
  const key = `${prefix}:${id}`;
  try {
    const raw = await redis.get(key);
    const count = raw ? parseInt(raw, 10) : 0;
    const pttl = await redis.pttl(key);
    return {
      allowed: count < points,
      remaining: Math.max(0, points - count),
      reset: pttl > 0 ? Date.now() + pttl : 0,
      mode: 'enforced',
    };
  } catch (err) {
    log.warn(`${name} peek error (fallback allow)`, undefined, err);
    return SKIP;
  }
}

async function clear(name: LimitName, id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const { prefix } = LIMITS[name];
  try {
    await redis.del(`${prefix}:${id}`);
  } catch (err) {
    log.warn(`${name} reset error`, undefined, err);
  }
}

// ── API pública (assinaturas inalteradas) ────────────────────────────────

export async function limitFormSubmit(ip: string): Promise<LimitResult> {
  return consume('forms', ip);
}

export async function limitAdminLogin(ip: string): Promise<LimitResult> {
  const redis = getRedis();
  if (!redis) return SKIP;
  try {
    // Ambas as camadas: burst (5/1min) + janela (10/15min). Qualquer uma nega.
    const [burst, window] = await Promise.all([consume('loginBurst', ip), consume('login', ip)]);
    if (burst.mode === 'skipped' && window.mode === 'skipped') return SKIP;
    const allowed = burst.allowed && window.allowed;
    const tighter = !burst.allowed
      ? burst
      : !window.allowed
        ? window
        : burst.remaining < window.remaining
          ? burst
          : window;
    return { allowed, remaining: tighter.remaining, reset: tighter.reset, mode: 'enforced' };
  } catch (err) {
    log.warn('adminLogin error (fallback allow)', undefined, err);
    return SKIP;
  }
}

/** Rate limit por email — protege contra credential stuffing rotacionando IPs. */
export async function limitAdminLoginByEmail(email: string): Promise<LimitResult> {
  return consume('loginEmail', email.trim().toLowerCase());
}

/** Consulta o bucket por-email SEM consumir token (peek). */
export async function peekAdminLoginByEmail(email: string): Promise<LimitResult> {
  return peek('loginEmail', email.trim().toLowerCase());
}

/** Limpa o bucket por-email (login bem-sucedido não deve penalizar o legítimo). */
export async function resetAdminLoginByEmail(email: string): Promise<void> {
  return clear('loginEmail', email.trim().toLowerCase());
}
