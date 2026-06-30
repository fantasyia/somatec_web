import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createLogger } from '@/lib/logger';

const log = createLogger('ratelimit');

type LimitResult = { allowed: boolean; remaining: number; reset: number; mode: 'enforced' | 'skipped' };

let formSubmitLimiter: Ratelimit | null = null;
let adminLoginLimiter: Ratelimit | null = null;
let adminLoginBurstLimiter: Ratelimit | null = null;
let adminLoginByEmailLimiter: Ratelimit | null = null;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    log.warn('UPSTASH_REDIS_REST_URL/TOKEN ausentes — fallback non-blocking');
    return;
  }

  const redis = new Redis({ url, token });

  // v1.1 §6.3: 5 submissões / 1 hora por IP
  formSubmitLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: false,
    prefix: 'msm:rl:forms',
  });

  // Camada 1 (mantida): 10 tentativas / 15 minutos por IP — janela longa
  adminLoginLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '15 m'),
    analytics: false,
    prefix: 'msm:rl:login',
  });

  // Camada 2 (nova): 5 tentativas / 1 minuto por IP — protege contra burst
  adminLoginBurstLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: false,
    prefix: 'msm:rl:login:burst',
  });

  // Camada 3 (nova): 5 tentativas / 1 hora por email — protege contra credential stuffing
  // (atacante rotacionando IPs ainda fica preso na conta-alvo)
  adminLoginByEmailLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: false,
    prefix: 'msm:rl:login:email',
  });
}

export async function limitFormSubmit(ip: string): Promise<LimitResult> {
  init();
  if (!formSubmitLimiter) {
    return { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };
  }
  try {
    const { success, remaining, reset } = await formSubmitLimiter.limit(ip);
    return { allowed: success, remaining, reset, mode: 'enforced' };
  } catch (err) {
    log.warn('formSubmit error (fallback allow)', undefined, err);
    return { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };
  }
}

export async function limitAdminLogin(ip: string): Promise<LimitResult> {
  init();
  if (!adminLoginLimiter || !adminLoginBurstLimiter) {
    return { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };
  }
  try {
    // Avalia ambas as camadas — qualquer uma negar bloqueia.
    const [burst, window] = await Promise.all([
      adminLoginBurstLimiter.limit(ip),
      adminLoginLimiter.limit(ip),
    ]);
    const allowed = burst.success && window.success;
    // Reporta a janela mais restritiva (menor reset) para UX
    const tighter = !burst.success
      ? burst
      : !window.success
        ? window
        : burst.remaining < window.remaining
          ? burst
          : window;
    return {
      allowed,
      remaining: tighter.remaining,
      reset: tighter.reset,
      mode: 'enforced',
    };
  } catch (err) {
    log.warn('adminLogin error (fallback allow)', undefined, err);
    return { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };
  }
}

/** Rate limit por email — protege contra credential stuffing rotacionando IPs. */
export async function limitAdminLoginByEmail(email: string): Promise<LimitResult> {
  init();
  if (!adminLoginByEmailLimiter) {
    return { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };
  }
  try {
    const key = email.trim().toLowerCase();
    const { success, remaining, reset } = await adminLoginByEmailLimiter.limit(key);
    return { allowed: success, remaining, reset, mode: 'enforced' };
  } catch (err) {
    log.warn('adminLoginByEmail error (fallback allow)', undefined, err);
    return { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };
  }
}

/**
 * Consulta o bucket por-email SEM consumir token (peek). Usado ANTES do signIn
 * para bloquear quando já estourou, sem debitar uma tentativa a cada requisição
 * (o débito agora só ocorre em FALHA de login, via limitAdminLoginByEmail).
 */
export async function peekAdminLoginByEmail(email: string): Promise<LimitResult> {
  init();
  if (!adminLoginByEmailLimiter) {
    return { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };
  }
  try {
    const key = email.trim().toLowerCase();
    const { remaining, reset } = await adminLoginByEmailLimiter.getRemaining(key);
    return { allowed: remaining > 0, remaining, reset, mode: 'enforced' };
  } catch (err) {
    log.warn('peekAdminLoginByEmail error (fallback allow)', undefined, err);
    return { allowed: true, remaining: -1, reset: 0, mode: 'skipped' };
  }
}

/** Limpa o bucket por-email (login bem-sucedido não deve penalizar o legítimo). */
export async function resetAdminLoginByEmail(email: string): Promise<void> {
  init();
  if (!adminLoginByEmailLimiter) return;
  try {
    await adminLoginByEmailLimiter.resetUsedTokens(email.trim().toLowerCase());
  } catch (err) {
    log.warn('resetAdminLoginByEmail error', undefined, err);
  }
}
