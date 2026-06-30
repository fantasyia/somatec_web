import 'server-only';

type LimitResult = { allowed: boolean; remaining: number; reset: number; mode: 'enforced' | 'skipped' };

/**
 * Builds standard rate-limit response headers from a LimitResult.
 *
 * - `Retry-After`: seconds until the limit resets (per RFC 7231 §7.1.3)
 * - `X-RateLimit-Remaining`: tentativas restantes na janela
 * - `X-RateLimit-Reset`: unix timestamp (segundos) em que a janela reseta
 *
 * Em modo `skipped` (Upstash não configurado), só inclui um header informativo.
 */
export function rateLimitHeaders(limit: LimitResult): Record<string, string> {
  if (limit.mode === 'skipped') {
    return { 'X-RateLimit-Mode': 'skipped' };
  }

  const headers: Record<string, string> = {
    'X-RateLimit-Mode': 'enforced',
  };

  if (limit.remaining >= 0) {
    headers['X-RateLimit-Remaining'] = String(limit.remaining);
  }

  if (limit.reset > 0) {
    // reset do Upstash vem em ms (epoch). Padronizar para segundos.
    const resetSeconds = Math.ceil(limit.reset / 1000);
    headers['X-RateLimit-Reset'] = String(resetSeconds);

    if (!limit.allowed) {
      const retryAfter = Math.max(1, resetSeconds - Math.floor(Date.now() / 1000));
      headers['Retry-After'] = String(retryAfter);
    }
  }

  return headers;
}
