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

export function createLogger(scope: string): Logger {
  return {
    debug: (msg, context) => emit('debug', scope, msg, context),
    info: (msg, context) => emit('info', scope, msg, context),
    warn: (msg, context, error) => emit('warn', scope, msg, context, error),
    error: (msg, context, error) => {
      emit('error', scope, msg, context, error);
      // Métrica: incrementa counter de erros por scope para alertas em Grafana/etc
      incrementCounter('msm_errors_total', { scope });
      // Reporta automaticamente para Sentry se DSN configurado (no-op caso contrário)
      reportError(error ?? new Error(msg), {
        scope,
        extra: { msg, ...(context ?? {}) },
      });
    },
    child: (subScope) => createLogger(`${scope}:${subScope}`),
  };
}

export const log = createLogger('app');
