import 'server-only';

/**
 * Helpers para construir headers HTTP padronizados em endpoints da API.
 *
 * Centralizado para que mudanças (versionamento, CORS allowlist) afetem apenas
 * este arquivo. Integra com OpenAPI: a version aqui deve bater com a
 * `info.version` em public/openapi.json.
 */

export const API_VERSION = '1.2';

const DEFAULT_CORS_ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'X-MSM-Signature',
  'Idempotency-Key',
].join(', ');

const DEFAULT_CORS_EXPOSED_HEADERS = [
  'X-API-Version',
  'X-Idempotent-Replay',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'X-RateLimit-Mode',
  'Retry-After',
].join(', ');

export function apiVersionHeaders(): Record<string, string> {
  return {
    'X-API-Version': API_VERSION,
  };
}

export type CorsOptions = {
  /**
   * Lista de origens permitidas. '*' libera para todos.
   * Default: '*' (público — apenas endpoints sem auth devem usar default).
   */
  origin?: string | string[];
  /** Métodos. Default: 'GET, POST, OPTIONS'. */
  methods?: string;
  /** Max-Age para preflight (segundos). Default: 86400 (1 dia). */
  maxAge?: number;
};

/**
 * Constrói os headers CORS. Para endpoints com Authorization (Bearer),
 * caller deve usar uma allowlist específica em vez de '*' por causa da spec
 * (allow-credentials + wildcard origin não combinam).
 */
export function corsHeaders(reqOrigin: string | null, options: CorsOptions = {}): Record<string, string> {
  const allowedOrigins = options.origin ?? '*';
  let originHeader = '*';

  if (Array.isArray(allowedOrigins)) {
    if (reqOrigin && allowedOrigins.includes(reqOrigin)) {
      originHeader = reqOrigin;
    } else {
      // Sem match, retorna apenas o primeiro como fallback (ou nada se vazio)
      originHeader = allowedOrigins[0] ?? 'null';
    }
  } else if (allowedOrigins !== '*') {
    originHeader = allowedOrigins;
  }

  return {
    'Access-Control-Allow-Origin': originHeader,
    'Access-Control-Allow-Methods': options.methods ?? 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': DEFAULT_CORS_ALLOWED_HEADERS,
    'Access-Control-Expose-Headers': DEFAULT_CORS_EXPOSED_HEADERS,
    'Access-Control-Max-Age': String(options.maxAge ?? 86400),
    Vary: 'Origin',
  };
}

/**
 * Compõe headers de uma response pública: API version + CORS.
 * Use em endpoints sem auth (health, csp-report, openapi.json).
 */
export function publicResponseHeaders(reqOrigin: string | null = null): Record<string, string> {
  return {
    ...apiVersionHeaders(),
    ...corsHeaders(reqOrigin),
  };
}
