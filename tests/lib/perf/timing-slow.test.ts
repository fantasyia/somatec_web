import { describe, it, expect, beforeEach, vi } from 'vitest';
import { withTiming } from '@/lib/perf/timing';
import { __resetForTests, renderPrometheus } from '@/lib/metrics/registry';

beforeEach(() => {
  __resetForTests();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('withTiming — slow/critical counters', () => {
  it('< slowMs: nenhum counter', async () => {
    await withTiming('fast', () => Promise.resolve('ok'), { slowMs: 100, criticalMs: 5000 });
    const out = renderPrometheus({});
    expect(out).not.toContain('msm_slow_operations_total');
    expect(out).not.toContain('msm_critical_operations_total');
  });

  it('entre slowMs e criticalMs: incrementa msm_slow_operations_total', async () => {
    await withTiming(
      'slow-op',
      () => new Promise((r) => setTimeout(() => r('ok'), 60)),
      { slowMs: 30, criticalMs: 5000 },
    );
    const out = renderPrometheus({});
    expect(out).toContain('msm_slow_operations_total{label="slow-op"} 1');
    expect(out).not.toContain('msm_critical_operations_total');
  });

  it('>= criticalMs: incrementa msm_critical_operations_total (não slow)', async () => {
    await withTiming(
      'critical-op',
      () => new Promise((r) => setTimeout(() => r('ok'), 80)),
      { slowMs: 30, criticalMs: 50 },
    );
    const out = renderPrometheus({});
    expect(out).toContain('msm_critical_operations_total{label="critical-op"} 1');
    // slow não é incrementado (critical exclui slow para evitar double-count)
    expect(out).not.toContain('msm_slow_operations_total');
  });

  it('separa counters por label', async () => {
    await withTiming('a', () => new Promise((r) => setTimeout(() => r(1), 40)), { slowMs: 30 });
    await withTiming('a', () => new Promise((r) => setTimeout(() => r(1), 40)), { slowMs: 30 });
    await withTiming('b', () => new Promise((r) => setTimeout(() => r(1), 40)), { slowMs: 30 });
    const out = renderPrometheus({});
    expect(out).toContain('msm_slow_operations_total{label="a"} 2');
    expect(out).toContain('msm_slow_operations_total{label="b"} 1');
  });

  it('critical-slow operation também incrementa msm_errors_total (via log.error)', async () => {
    await withTiming(
      'super-slow',
      () => new Promise((r) => setTimeout(() => r('ok'), 80)),
      { slowMs: 30, criticalMs: 50 },
    );
    const out = renderPrometheus({});
    expect(out).toContain('msm_critical_operations_total{label="super-slow"} 1');
    expect(out).toContain('msm_errors_total{scope="perf"}');
  });
});
