import { describe, it, expect, beforeEach } from 'vitest';
import {
  incrementCounter,
  setGauge,
  observeHistogram,
  trackRequest,
  renderPrometheus,
  __resetForTests,
} from '@/lib/metrics/registry';

beforeEach(() => __resetForTests());

describe('incrementCounter', () => {
  it('inicia em 0 e incrementa', () => {
    incrementCounter('m_test');
    incrementCounter('m_test');
    const out = renderPrometheus({});
    expect(out).toContain('m_test 2');
  });

  it('separa por labels', () => {
    incrementCounter('m_x', { a: '1' });
    incrementCounter('m_x', { a: '2' });
    incrementCounter('m_x', { a: '1' });
    const out = renderPrometheus({});
    expect(out).toContain('m_x{a="1"} 2');
    expect(out).toContain('m_x{a="2"} 1');
  });

  it('aceita incremento customizado', () => {
    incrementCounter('m_y', undefined, 5);
    incrementCounter('m_y', undefined, 3);
    const out = renderPrometheus({});
    expect(out).toContain('m_y 8');
  });
});

describe('setGauge', () => {
  it('sobrescreve valor anterior', () => {
    setGauge('temp', 20);
    setGauge('temp', 25);
    const out = renderPrometheus({});
    expect(out).toContain('temp 25');
  });

  it('separa por labels', () => {
    setGauge('queue_depth', 10, { table: 'a' });
    setGauge('queue_depth', 5, { table: 'b' });
    const out = renderPrometheus({});
    expect(out).toContain('queue_depth{table="a"} 10');
    expect(out).toContain('queue_depth{table="b"} 5');
  });
});

describe('observeHistogram', () => {
  it('acumula buckets cumulativos + sum + count', () => {
    observeHistogram('lat_ms', 5);
    observeHistogram('lat_ms', 50);
    observeHistogram('lat_ms', 500);
    const out = renderPrometheus({});
    expect(out).toContain('lat_ms_bucket{le="5"} 1');
    expect(out).toContain('lat_ms_bucket{le="100"} 2');
    expect(out).toContain('lat_ms_bucket{le="1000"} 3');
    expect(out).toContain('lat_ms_bucket{le="+Inf"} 3');
    expect(out).toContain('lat_ms_sum 555');
    expect(out).toContain('lat_ms_count 3');
  });
});

describe('trackRequest', () => {
  it('agrupa por classe de status (2xx/4xx/5xx)', () => {
    trackRequest('/api/x', 200);
    trackRequest('/api/x', 201);
    trackRequest('/api/x', 400);
    trackRequest('/api/x', 500);
    const out = renderPrometheus({});
    expect(out).toContain('msm_http_requests_total{route="/api/x",status="2xx"} 2');
    expect(out).toContain('msm_http_requests_total{route="/api/x",status="4xx"} 1');
    expect(out).toContain('msm_http_requests_total{route="/api/x",status="5xx"} 1');
  });
});

describe('renderPrometheus', () => {
  it('emite HELP e TYPE quando metadata fornecida', () => {
    incrementCounter('hits');
    const out = renderPrometheus({ hits: { help: 'Total hits.', type: 'counter' } });
    expect(out).toContain('# HELP hits Total hits.');
    expect(out).toContain('# TYPE hits counter');
  });

  it('omite HELP/TYPE quando metadata ausente', () => {
    incrementCounter('nameless');
    const out = renderPrometheus({});
    expect(out).not.toContain('# HELP nameless');
    expect(out).not.toContain('# TYPE nameless');
    expect(out).toContain('nameless 1');
  });

  it('escapa quotes e newlines em label values', () => {
    incrementCounter('m', { msg: 'has "quote"' });
    const out = renderPrometheus({});
    expect(out).toContain('m{msg="has \\"quote\\""} 1');
  });

  it('output termina com newline', () => {
    incrementCounter('a');
    expect(renderPrometheus({})).toMatch(/\n$/);
  });

  it('Map vazio → string vazia + newline', () => {
    expect(renderPrometheus({})).toBe('\n');
  });
});
