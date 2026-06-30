import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { GET, OPTIONS } = await import('@/app/api/version/route');

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/version', { headers });
}

afterEach(() => vi.unstubAllEnvs());

describe('GET /api/version', () => {
  it('retorna 200 com body padrão', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.api_version).toMatch(/^\d+\.\d+/);
    expect(json.next_version).toBeDefined();
    expect(json.node_version).toMatch(/^\d+\.\d+/);
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('expõe commit_sha quando env presente', async () => {
    vi.stubEnv('RAILWAY_GIT_COMMIT_SHA', 'abcdef1234567890');
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.commit_sha).toBe('abcdef1234567890');
    expect(json.commit_short).toBe('abcdef1');
  });

  it('aceita GITHUB_SHA como fallback', async () => {
    vi.stubEnv('RAILWAY_GIT_COMMIT_SHA', '');
    vi.stubEnv('GITHUB_SHA', 'fedcba9876543210');
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.commit_sha).toBe('fedcba9876543210');
  });

  it('commit_sha null quando ausente', async () => {
    vi.stubEnv('RAILWAY_GIT_COMMIT_SHA', '');
    vi.stubEnv('GITHUB_SHA', '');
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.commit_sha).toBeNull();
    expect(json.commit_short).toBeNull();
  });

  it('detecta platform railway', async () => {
    vi.stubEnv('RAILWAY_PROJECT_ID', 'proj-123');
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.deployment.platform).toBe('railway');
  });

  it('platform unknown sem RAILWAY_PROJECT_ID', async () => {
    vi.stubEnv('RAILWAY_PROJECT_ID', '');
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.deployment.platform).toBe('unknown');
  });

  it('headers incluem X-API-Version + CORS', async () => {
    const res = await GET(makeRequest());
    expect(res.headers.get('X-API-Version')).toMatch(/^\d+\.\d+/);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
  });

  it('worker.uptime_seconds >= 0', async () => {
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.worker.uptime_seconds).toBeGreaterThanOrEqual(0);
  });
});

describe('OPTIONS /api/version (CORS preflight)', () => {
  it('retorna 204 com headers CORS', async () => {
    const res = await OPTIONS(makeRequest({ origin: 'https://msm.com.br' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
  });
});
