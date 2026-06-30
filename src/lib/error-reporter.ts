import 'server-only';

// =============================================================================
// Error reporter para Sentry — implementação leve via HTTP envelope.
// Sem dependência do SDK @sentry/nextjs (que adiciona ~500KB).
//
// Para upgrade futuro: trocar reportError() por Sentry.captureException()
// e adicionar sentry.{client,server,edge}.config.ts.
//
// Ativação: defina SENTRY_DSN. Se ausente, vira no-op silencioso.
// =============================================================================

type SentryEnvelopeMeta = { dsn: string; key: string; projectId: string; host: string };

let parsed: SentryEnvelopeMeta | null | undefined;

function getMeta(): SentryEnvelopeMeta | null {
  if (parsed !== undefined) return parsed;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    parsed = null;
    return null;
  }
  try {
    // DSN format: https://<key>@<host>/<projectId>
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, '');
    parsed = {
      dsn,
      key: u.username,
      projectId,
      host: u.host,
    };
    return parsed;
  } catch {
    parsed = null;
    return null;
  }
}

export type ErrorContext = {
  scope?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
};

/**
 * Envia um erro para o Sentry (fire-and-forget). Se SENTRY_DSN não estiver
 * configurado, vira no-op. Não bloqueia o fluxo do request.
 */
export function reportError(error: unknown, ctx: ErrorContext = {}): void {
  const meta = getMeta();
  if (!meta) return;

  const errObj =
    error instanceof Error
      ? { type: error.name, value: error.message, stacktrace: stringifyStack(error.stack) }
      : { type: 'NonError', value: String(error), stacktrace: undefined };

  const event = {
    event_id: cryptoRandomHex(32),
    timestamp: Date.now() / 1000,
    platform: 'node',
    level: 'error',
    environment: process.env.NODE_ENV ?? 'unknown',
    release: process.env.RAILWAY_GIT_COMMIT_SHA ?? undefined,
    server_name: process.env.RAILWAY_SERVICE_NAME ?? 'msm-site',
    tags: { scope: ctx.scope ?? 'app', ...(ctx.tags ?? {}) },
    extra: ctx.extra,
    user: ctx.user,
    exception: {
      values: [
        {
          type: errObj.type,
          value: errObj.value,
          stacktrace: errObj.stacktrace
            ? { frames: parseStackFrames(errObj.stacktrace) }
            : undefined,
        },
      ],
    },
  };

  const envelope = [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');

  const url = `https://${meta.host}/api/${meta.projectId}/envelope/`;
  const auth = `Sentry sentry_version=7,sentry_key=${meta.key},sentry_client=msm-site/1.0`;

  // Fire-and-forget — não esperamos resposta nem bloqueamos
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': auth,
    },
    body: envelope,
    signal: AbortSignal.timeout(3000),
  }).catch(() => {
    // não pode lançar — error reporter falhando não pode quebrar o caller
  });
}

function stringifyStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  return stack;
}

function parseStackFrames(stack: string): Array<{ filename: string; function: string; lineno?: number; colno?: number }> {
  const lines = stack.split('\n').slice(1); // pula a primeira linha (mensagem)
  const frames: Array<{ filename: string; function: string; lineno?: number; colno?: number }> = [];
  for (const line of lines) {
    const m = line.match(/at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/) ?? line.match(/at\s+(.*?):(\d+):(\d+)/);
    if (!m) continue;
    if (m.length === 5) {
      frames.push({
        function: m[1] ?? '?',
        filename: m[2] ?? '?',
        lineno: Number(m[3]),
        colno: Number(m[4]),
      });
    } else if (m.length === 4) {
      frames.push({
        function: '?',
        filename: m[1] ?? '?',
        lineno: Number(m[2]),
        colno: Number(m[3]),
      });
    }
  }
  // Sentry espera frames na ordem inversa (mais recente por último)
  return frames.reverse();
}

function cryptoRandomHex(length: number): string {
  // length em chars hex; bytes = length/2
  const bytes = new Uint8Array(length / 2);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
