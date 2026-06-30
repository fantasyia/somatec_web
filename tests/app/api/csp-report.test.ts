import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { __resetForTests, renderPrometheus } from '@/lib/metrics/registry';

const { POST } = await import('@/app/api/csp-report/route');

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': 'application/csp-report', 'user-agent': 'TestAgent/1.0' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => __resetForTests());

describe('POST /api/csp-report', () => {
  it('aceita formato CSP Level 2 e retorna 204', async () => {
    const report = {
      'csp-report': {
        'document-uri': 'https://msm.com/page',
        'violated-directive': 'script-src',
        'effective-directive': 'script-src',
        'blocked-uri': 'https://evil.com/script.js',
        'source-file': 'https://msm.com/inline',
        'line-number': 42,
      },
    };
    const res = await POST(makeRequest(report));
    expect(res.status).toBe(204);

    const metrics = renderPrometheus({});
    expect(metrics).toContain('msm_csp_violations_total{directive="script-src"} 1');
  });

  it('aceita formato Level 3 (Reporting API)', async () => {
    const report = [
      {
        type: 'csp-violation',
        body: {
          documentURL: 'https://msm.com/page',
          effectiveDirective: 'img-src',
          blockedURL: 'http://insecure.example.com/img.png',
          sourceFile: 'https://msm.com/x.js',
          lineNumber: 10,
        },
      },
    ];
    const res = await POST(makeRequest(report));
    expect(res.status).toBe(204);
    expect(renderPrometheus({})).toContain('msm_csp_violations_total{directive="img-src"} 1');
  });

  it('agrupa por directive (alta cardinalidade evitada)', async () => {
    await POST(makeRequest({ 'csp-report': { 'effective-directive': 'script-src' } }));
    await POST(makeRequest({ 'csp-report': { 'effective-directive': 'script-src' } }));
    await POST(makeRequest({ 'csp-report': { 'effective-directive': 'img-src' } }));

    const metrics = renderPrometheus({});
    expect(metrics).toContain('msm_csp_violations_total{directive="script-src"} 2');
    expect(metrics).toContain('msm_csp_violations_total{directive="img-src"} 1');
    expect(metrics).not.toContain('blocked-uri');
  });

  it('retorna 400 com JSON inválido', async () => {
    const res = await POST(makeRequest('not json{'));
    expect(res.status).toBe(400);
  });

  it('retorna 204 silencioso quando payload não reconhecido', async () => {
    const res = await POST(makeRequest({ random: 'thing' }));
    expect(res.status).toBe(204);
    // Sem counter incrementado
    const metrics = renderPrometheus({});
    expect(metrics).not.toContain('msm_csp_violations_total');
  });

  it('fallback de directive como "unknown" não crasha', async () => {
    const res = await POST(makeRequest({ 'csp-report': { 'blocked-uri': 'x' } }));
    expect(res.status).toBe(204);
    expect(renderPrometheus({})).toContain('msm_csp_violations_total{directive="unknown"} 1');
  });

  it('trunca valores longos no log (sem afetar response)', async () => {
    const longUri = 'https://msm.com/' + 'a'.repeat(2000);
    const res = await POST(makeRequest({
      'csp-report': {
        'document-uri': longUri,
        'effective-directive': 'connect-src',
        'blocked-uri': longUri,
      },
    }));
    expect(res.status).toBe(204);
    // Métrica não tem URL (apenas directive)
    expect(renderPrometheus({})).toContain('msm_csp_violations_total{directive="connect-src"} 1');
  });
});
