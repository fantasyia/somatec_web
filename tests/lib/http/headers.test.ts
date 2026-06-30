import { describe, it, expect } from 'vitest';
import {
  API_VERSION,
  apiVersionHeaders,
  corsHeaders,
  publicResponseHeaders,
} from '@/lib/http/headers';

describe('apiVersionHeaders', () => {
  it('inclui X-API-Version', () => {
    const h = apiVersionHeaders();
    expect(h['X-API-Version']).toBe(API_VERSION);
  });

  it('API_VERSION segue semver (X.Y)', () => {
    expect(API_VERSION).toMatch(/^\d+\.\d+/);
  });
});

describe('corsHeaders — wildcard default', () => {
  it('Access-Control-Allow-Origin: * sem opções', () => {
    const h = corsHeaders(null);
    expect(h['Access-Control-Allow-Origin']).toBe('*');
  });

  it('inclui Methods + Headers + Expose padrão', () => {
    const h = corsHeaders(null);
    expect(h['Access-Control-Allow-Methods']).toContain('GET');
    expect(h['Access-Control-Allow-Methods']).toContain('OPTIONS');
    expect(h['Access-Control-Allow-Headers']).toContain('Authorization');
    expect(h['Access-Control-Allow-Headers']).toContain('Content-Type');
    expect(h['Access-Control-Allow-Headers']).toContain('Idempotency-Key');
    expect(h['Access-Control-Expose-Headers']).toContain('X-API-Version');
    expect(h['Access-Control-Expose-Headers']).toContain('Retry-After');
  });

  it('Max-Age default 86400', () => {
    expect(corsHeaders(null)['Access-Control-Max-Age']).toBe('86400');
  });

  it('Vary: Origin sempre presente', () => {
    expect(corsHeaders(null).Vary).toBe('Origin');
  });
});

describe('corsHeaders — origin allowlist', () => {
  it('aceita origin único como string', () => {
    const h = corsHeaders('https://test.com', { origin: 'https://msm.com' });
    expect(h['Access-Control-Allow-Origin']).toBe('https://msm.com');
  });

  it('array: retorna requestOrigin se está na lista', () => {
    const h = corsHeaders('https://msm.com.br', {
      origin: ['https://msm.com', 'https://msm.com.br'],
    });
    expect(h['Access-Control-Allow-Origin']).toBe('https://msm.com.br');
  });

  it('array: fallback pro primeiro se origem não está', () => {
    const h = corsHeaders('https://evil.com', {
      origin: ['https://msm.com', 'https://msm.com.br'],
    });
    expect(h['Access-Control-Allow-Origin']).toBe('https://msm.com');
  });

  it('array vazio: "null"', () => {
    const h = corsHeaders('https://x.com', { origin: [] });
    expect(h['Access-Control-Allow-Origin']).toBe('null');
  });

  it('methods customizado', () => {
    const h = corsHeaders(null, { methods: 'GET, OPTIONS' });
    expect(h['Access-Control-Allow-Methods']).toBe('GET, OPTIONS');
  });

  it('maxAge customizado', () => {
    const h = corsHeaders(null, { maxAge: 600 });
    expect(h['Access-Control-Max-Age']).toBe('600');
  });
});

describe('publicResponseHeaders', () => {
  it('combina apiVersion + cors wildcard', () => {
    const h = publicResponseHeaders(null);
    expect(h['X-API-Version']).toBe(API_VERSION);
    expect(h['Access-Control-Allow-Origin']).toBe('*');
    expect(h['Vary']).toBe('Origin');
  });

  it('aceita requestOrigin para CORS', () => {
    const h = publicResponseHeaders('https://prometheus.example.com');
    expect(h['X-API-Version']).toBe(API_VERSION);
  });
});
