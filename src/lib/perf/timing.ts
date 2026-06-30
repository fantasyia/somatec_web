import 'server-only';
import { createLogger } from '@/lib/logger';
import { incrementCounter, observeHistogram } from '@/lib/metrics/registry';

const log = createLogger('perf');

const DEFAULT_SLOW_MS = Number(process.env.SLOW_QUERY_MS ?? 500);
const DEFAULT_CRITICAL_MS = Number(process.env.CRITICAL_QUERY_MS ?? 5000);

export type TimingOptions = {
  /** Acima desse limite, loga como warn + incrementa msm_slow_operations_total. Default: SLOW_QUERY_MS env var ou 500ms. */
  slowMs?: number;
  /** Acima desse limite, loga como error + incrementa msm_critical_operations_total. Default: CRITICAL_QUERY_MS env var ou 5000ms. */
  criticalMs?: number;
  /** Contexto extra anexado ao log. */
  context?: Record<string, unknown>;
};

/**
 * Mede tempo de execução de uma operação assíncrona.
 * - `debug` se < slowMs
 * - `warn` + counter msm_slow_operations_total{label} se [slowMs, criticalMs)
 * - `error` + counter msm_critical_operations_total{label} se >= criticalMs
 *   (também aciona log.error → métrica msm_errors_total + Sentry envelope)
 *
 * Uso típico:
 *   const data = await withTiming('home:fetch-all', () => fetchHomeData());
 *   await withTiming('webhook:enqueue', () => enqueueSubmission(...));
 */
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
  options: TimingOptions = {},
): Promise<T> {
  const slowMs = options.slowMs ?? DEFAULT_SLOW_MS;
  const criticalMs = options.criticalMs ?? DEFAULT_CRITICAL_MS;
  const start = Date.now();
  try {
    const result = await fn();
    const duration_ms = Date.now() - start;
    observeHistogram('msm_operation_duration_ms', duration_ms, { label, status: 'ok' });

    if (duration_ms >= criticalMs) {
      incrementCounter('msm_critical_operations_total', { label });
      log.error('critical-slow operation', { label, duration_ms, threshold_ms: criticalMs, ...options.context });
    } else if (duration_ms > slowMs) {
      incrementCounter('msm_slow_operations_total', { label });
      log.warn('slow operation', { label, duration_ms, threshold_ms: slowMs, ...options.context });
    } else {
      log.debug('operation', { label, duration_ms, ...options.context });
    }
    return result;
  } catch (err) {
    const duration_ms = Date.now() - start;
    observeHistogram('msm_operation_duration_ms', duration_ms, { label, status: 'error' });
    log.warn('operation failed', { label, duration_ms, ...options.context }, err);
    throw err;
  }
}
