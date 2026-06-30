import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '@/lib/logger';

const origEnv = { ...process.env };

describe('createLogger', () => {
  let spyLog: ReturnType<typeof vi.spyOn>;
  let spyWarn: ReturnType<typeof vi.spyOn>;
  let spyError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    spyLog.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
    process.env = { ...origEnv };
  });

  it('emite info com scope', () => {
    const log = createLogger('test');
    log.info('hello');
    expect(spyLog).toHaveBeenCalledOnce();
    const call = spyLog.mock.calls[0]?.[0];
    expect(String(call)).toContain('INFO');
    expect(String(call)).toContain('test');
    expect(String(call)).toContain('hello');
  });

  it('emite warn no canal correto', () => {
    const log = createLogger('test');
    log.warn('oops');
    expect(spyWarn).toHaveBeenCalledOnce();
    expect(spyLog).not.toHaveBeenCalled();
  });

  it('emite error no canal correto', () => {
    const log = createLogger('test');
    log.error('boom');
    expect(spyError).toHaveBeenCalledOnce();
  });

  it('child logger prefixa scope', () => {
    const log = createLogger('a');
    const child = log.child('b');
    child.info('test');
    const call = spyLog.mock.calls[0]?.[0];
    expect(String(call)).toContain('a:b');
  });

  it('serializa Error com message+stack', () => {
    const log = createLogger('test');
    const err = new Error('falhou');
    log.error('ops', { ctx: 1 }, err);
    const calls = spyError.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(calls);
    expect(serialized).toContain('falhou');
  });

  it('log.error incrementa contador msm_errors_total{scope}', async () => {
    // Reseta registry antes; usar import dinâmico para garantir mesma instância
    const { __resetForTests, renderPrometheus } = await import('@/lib/metrics/registry');
    __resetForTests();

    const log1 = createLogger('test:scope-a');
    const log2 = createLogger('test:scope-b');
    log1.error('erro 1');
    log1.error('erro 2');
    log2.error('erro único');

    const out = renderPrometheus({});
    expect(out).toContain('msm_errors_total{scope="test:scope-a"} 2');
    expect(out).toContain('msm_errors_total{scope="test:scope-b"} 1');
  });
});
