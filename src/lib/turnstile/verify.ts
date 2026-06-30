import 'server-only';
import { createLogger } from '@/lib/logger';

const log = createLogger('turnstile');
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type TurnstileResult =
  | { success: true; challenge_ts?: string; hostname?: string; action?: string }
  | { success: false; 'error-codes'?: string[]; messages?: string[] };

export type TurnstileVerifyOutcome =
  | { ok: true; mode: 'verified' }
  | { ok: true; mode: 'skipped'; reason: string }
  // infraFailure = não foi possível VERIFICAR (Cloudflare lenta/fora) — distinto de
  // "token comprovadamente inválido". O caller pode aceitar com flag (fail-open).
  | { ok: false; reason: string; infraFailure?: boolean };

/**
 * Verifica o token Turnstile.
 *
 * Comportamento:
 *  - Em produção (process.env.NODE_ENV === 'production') com TURNSTILE_SECRET_KEY definido:
 *    valida o token de verdade. Token inválido → ok: false.
 *  - Sem TURNSTILE_SECRET_KEY (dev sem configurar ainda):
 *    pula validação e loga warning. Aceita qualquer submit. NÃO é seguro em prod.
 */
export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string,
): Promise<TurnstileVerifyOutcome> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // Em prod sem chave configurada — bloqueia preventivamente para não virar porta aberta.
      log.warn('TURNSTILE_SECRET_KEY ausente em produção — bloqueando submit');
      return { ok: false, reason: 'turnstile_not_configured_prod' };
    }
    log.warn('sem TURNSTILE_SECRET_KEY — pulando validação (dev)');
    return { ok: true, mode: 'skipped', reason: 'no_secret_dev' };
  }

  if (!token) {
    return { ok: false, reason: 'missing_token' };
  }

  try {
    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);
    if (remoteIp) body.append('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      // 5s timeout via AbortSignal
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      // HTTP não-OK do endpoint da Cloudflare = falha de infra (não do token).
      return { ok: false, reason: `verify_http_${res.status}`, infraFailure: true };
    }

    const data = (await res.json()) as TurnstileResult;
    if (data.success) {
      return { ok: true, mode: 'verified' };
    }
    return {
      ok: false,
      reason: `turnstile_failed:${(data['error-codes'] ?? []).join(',') || 'unknown'}`,
    };
  } catch (err) {
    // Timeout/DNS/rede até a Cloudflare = falha de infra (não do token).
    log.warn('verify error', undefined, err);
    return { ok: false, reason: 'verify_exception', infraFailure: true };
  }
}
