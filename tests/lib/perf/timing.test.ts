import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTiming } from '@/lib/perf/timing';

describe('withTiming', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('retorna o valor da função quando rápido', async () => {
    const result = await withTiming('fast', () => Promise.resolve(42));
    expect(result).toBe(42);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('loga warn quando excede slowMs', async () => {
    await withTiming('slow', () => new Promise((r) => setTimeout(() => r('done'), 60)), {
      slowMs: 30,
    });
    expect(warnSpy).toHaveBeenCalled();
    const call = warnSpy.mock.calls[0]?.[0];
    expect(String(call)).toContain('slow operation');
  });

  it('propaga e loga warn em erro', async () => {
    await expect(
      withTiming('failing', () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    expect(warnSpy).toHaveBeenCalled();
    const call = warnSpy.mock.calls[0]?.[0];
    expect(String(call)).toContain('operation failed');
  });

  it('inclui contexto extra no log', async () => {
    await withTiming('with-ctx', () => new Promise((r) => setTimeout(() => r('ok'), 50)), {
      slowMs: 10,
      context: { recordId: 'x123' },
    });
    expect(warnSpy).toHaveBeenCalled();
    // logger pretty mode em test passa string + objeto; verifica via JSON.stringify
    const allCalls = JSON.stringify(warnSpy.mock.calls);
    expect(allCalls).toContain('x123');
  });
});
