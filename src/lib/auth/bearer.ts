import 'server-only';
import { timingSafeEqual } from 'node:crypto';

/**
 * Helper para validar Bearer tokens em endpoints internos (crons, revalidate, metrics).
 *
 * Suporta zero-downtime rotation: a env var pode conter UM ou DOIS tokens
 * separados por vírgula. Ambos são aceitos.
 *
 * Fluxo de rotação:
 *   1. Setar env = "novo,atual" → ambos válidos. Deploy.
 *   2. Atualizar callers/scrapers para usar o novo. Deploy.
 *   3. Setar env = "novo" → só o novo é aceito. Deploy.
 *
 * Comparação em tempo constante (timingSafeEqual) para mitigar timing attacks.
 */

export type BearerCheckResult =
  | { ok: true }
  | { ok: false; reason: 'missing_secret' | 'missing_header' | 'invalid_token' };

function parseSecrets(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function constantTimeEquals(a: string, b: string): boolean {
  // Comparar SEMPRE sobre bytes UTF-8, alinhando a checagem de comprimento com o
  // timingSafeEqual (que lança RangeError se os buffers tiverem tamanhos
  // diferentes). Comparar .length de string (code-units UTF-16) com buffers de
  // bytes permitia que tokens multibyte de mesmo .length tivessem byte-lengths
  // diferentes e fizessem o timingSafeEqual lançar — virando 500 em vez de 401.
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Dummy compare de mesmo tamanho para manter custo aproximado (anti timing oracle).
    try {
      timingSafeEqual(ba, Buffer.alloc(ba.length));
    } catch {
      // ignore
    }
    return false;
  }
  return timingSafeEqual(ba, bb);
}

/**
 * Valida Authorization: Bearer <token> contra os secrets em process.env[envName].
 *
 * - Se a env var não existir e `requireInProduction` for true + NODE_ENV=production:
 *   retorna { ok: false, reason: 'missing_secret' }.
 *   Caller deve responder 500 (config faltando).
 *
 * - Se header ausente: { ok: false, reason: 'missing_header' } → caller responde 401.
 * - Se token não bate com nenhum dos secrets: { ok: false, reason: 'invalid_token' } → 401.
 * - Match: { ok: true }.
 */
export function validateBearer(
  authHeader: string | null,
  envName: string,
  options: { requireInProduction?: boolean } = {},
): BearerCheckResult {
  const secrets = parseSecrets(process.env[envName]);

  if (secrets.length === 0) {
    if (options.requireInProduction && process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'missing_secret' };
    }
    // Sem secret configurado em dev/test → aceita sem auth (caller decide).
    return { ok: true };
  }

  if (!authHeader) return { ok: false, reason: 'missing_header' };

  const prefix = 'Bearer ';
  if (!authHeader.startsWith(prefix)) return { ok: false, reason: 'invalid_token' };
  const token = authHeader.slice(prefix.length).trim();
  if (!token) return { ok: false, reason: 'invalid_token' };

  for (const secret of secrets) {
    if (constantTimeEquals(token, secret)) return { ok: true };
  }
  return { ok: false, reason: 'invalid_token' };
}
