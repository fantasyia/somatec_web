import 'server-only';
import { reportError } from '@/lib/error-reporter';
import { incrementCounter } from '@/lib/metrics/registry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function getMinLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? '').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const MIN_LEVEL = LEVEL_ORDER[getMinLevel()];
const IS_PROD = process.env.NODE_ENV === 'production';

function serialize(level: LogLevel, scope: string, message: string, context?: LogContext, error?: unknown) {
  const entry: Record<string, unknown> = {
    level,
    scope,
    msg: message,
    time: new Date().toISOString(),
  };
  if (context) Object.assign(entry, context);
  if (error instanceof Error) {
    entry.error = { name: error.name, message: error.message, stack: error.stack };
  } else if (error !== undefined) {
    entry.error = error;
  }
  return entry;
}

function emit(level: LogLevel, scope: string, message: string, context?: LogContext, error?: unknown) {
  if (LEVEL_ORDER[level] < MIN_LEVEL) return;
  const entry = serialize(level, scope, message, context, error);
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (IS_PROD) {
    fn(JSON.stringify(entry));
  } else {
    const { time, msg, ...rest } = entry;
    fn(`[${time}] ${level.toUpperCase()} ${scope}: ${msg}`, Object.keys(rest).length > 2 ? rest : '');
  }
}

export type Logger = {
  debug: (msg: string, context?: LogContext) => void;
  info: (msg: string, context?: LogContext) => void;
  warn: (msg: string, context?: LogContext, error?: unknown) => void;
  error: (msg: string, context?: LogContext, error?: unknown) => void;
  child: (subScope: string) => Logger;
};

/**
 * O erro que representa um `log.error` sem exceção por baixo.
 *
 * ⚠️ `Error.captureStackTrace` aqui NÃO é detalhe. Sem ele, o quadro do topo da
 * pilha é esta própria função — e o Sentry usa o topo pra dizer de ONDE o erro
 * veio. Como o bundler joga o logger num pedaço qualquer, em produção TODO
 * `log.error` do site aparecia como se tivesse nascido em
 * `api/lgpd/consent/route.js`, que é só onde o módulo caiu. Três erros de três
 * lugares diferentes, todos com o mesmo culpado errado.
 *
 * O segundo argumento corta a pilha ABAIXO desta função, então o topo passa a
 * ser quem chamou `log.error` de verdade. Funciona independente de como o
 * bundler nomeou o arquivo — que é o motivo de não dar pra resolver isso
 * filtrando quadro por nome.
 */
function erroDoLog(msg: string, cortarAte: (...args: never[]) => unknown): Error {
  const e = new Error(msg);
  // Remove `cortarAte` e tudo acima dele — ou seja, esta função E o método do
  // logger. O topo passa a ser quem chamou `log.error`.
  Error.captureStackTrace?.(e, cortarAte);
  return e;
}

export function createLogger(scope: string): Logger {
  // Função NOMEADA de propósito: o `erroDoLog` precisa de uma referência a ela
  // pra saber até onde cortar a pilha. Como arrow anônima dentro do objeto, não
  // haveria o que passar — e o topo continuaria sendo o logger.
  function erro(msg: string, context?: LogContext, error?: unknown): void {
    emit('error', scope, msg, context, error);
    // Métrica: incrementa counter de erros por scope para alertas em Grafana/etc
    incrementCounter('msm_errors_total', { scope });
    // Vai pro Sentry pelo SDK — é o que faz o evento passar pelo filtro de
    // dado pessoal. Sem DSN, no-op.
    reportError(error ?? erroDoLog(msg, erro), {
      scope,
      extra: { msg, ...(context ?? {}) },
    });
  }

  return {
    debug: (msg, context) => emit('debug', scope, msg, context),
    info: (msg, context) => emit('info', scope, msg, context),
    warn: (msg, context, error) => emit('warn', scope, msg, context, error),
    error: erro,
    child: (subScope) => createLogger(`${scope}:${subScope}`),
  };
}

export const log = createLogger('app');
