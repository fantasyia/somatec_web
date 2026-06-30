import { describe, it, expect, afterEach, vi } from 'vitest';
import { validateBearer } from '@/lib/auth/bearer';

afterEach(() => vi.unstubAllEnvs());

describe('validateBearer — secret ausente', () => {
  it('em prod com requireInProduction: missing_secret', () => {
    vi.stubEnv('TEST_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');
    const r = validateBearer('Bearer x', 'TEST_SECRET', { requireInProduction: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('missing_secret');
  });

  it('em dev sem requireInProduction: aceita sem auth', () => {
    vi.stubEnv('TEST_SECRET', '');
    vi.stubEnv('NODE_ENV', 'development');
    const r = validateBearer('Bearer x', 'TEST_SECRET');
    expect(r.ok).toBe(true);
  });

  it('em prod sem requireInProduction: aceita sem auth', () => {
    vi.stubEnv('TEST_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');
    const r = validateBearer('Bearer x', 'TEST_SECRET');
    expect(r.ok).toBe(true);
  });
});

describe('validateBearer — single secret', () => {
  it('aceita Bearer com token correto', () => {
    vi.stubEnv('TEST_SECRET', 'abc123');
    expect(validateBearer('Bearer abc123', 'TEST_SECRET').ok).toBe(true);
  });

  it('rejeita token diferente', () => {
    vi.stubEnv('TEST_SECRET', 'abc123');
    const r = validateBearer('Bearer wrong', 'TEST_SECRET');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_token');
  });

  it('rejeita header ausente', () => {
    vi.stubEnv('TEST_SECRET', 'abc123');
    const r = validateBearer(null, 'TEST_SECRET');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('missing_header');
  });

  it('rejeita header sem prefixo "Bearer "', () => {
    vi.stubEnv('TEST_SECRET', 'abc123');
    const r = validateBearer('abc123', 'TEST_SECRET');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_token');
  });

  it('rejeita "Bearer" sem token', () => {
    vi.stubEnv('TEST_SECRET', 'abc123');
    const r = validateBearer('Bearer ', 'TEST_SECRET');
    expect(r.ok).toBe(false);
  });

  it('comprimento diferente: rejeita sem crash', () => {
    vi.stubEnv('TEST_SECRET', 'abc123');
    expect(validateBearer('Bearer ab', 'TEST_SECRET').ok).toBe(false);
    expect(validateBearer('Bearer abc1234567', 'TEST_SECRET').ok).toBe(false);
  });
});

describe('validateBearer — CSV rotation (dois secrets)', () => {
  it('aceita o secret atual', () => {
    vi.stubEnv('TEST_SECRET', 'new-token,old-token');
    expect(validateBearer('Bearer new-token', 'TEST_SECRET').ok).toBe(true);
  });

  it('aceita o secret antigo (durante rotação)', () => {
    vi.stubEnv('TEST_SECRET', 'new-token,old-token');
    expect(validateBearer('Bearer old-token', 'TEST_SECRET').ok).toBe(true);
  });

  it('rejeita um terceiro token não listado', () => {
    vi.stubEnv('TEST_SECRET', 'new-token,old-token');
    const r = validateBearer('Bearer outdated-token', 'TEST_SECRET');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_token');
  });

  it('ignora whitespace em volta de cada token na CSV', () => {
    vi.stubEnv('TEST_SECRET', '  new , old  ');
    expect(validateBearer('Bearer new', 'TEST_SECRET').ok).toBe(true);
    expect(validateBearer('Bearer old', 'TEST_SECRET').ok).toBe(true);
  });

  it('ignora entries vazias na CSV', () => {
    vi.stubEnv('TEST_SECRET', 'a,,b,');
    expect(validateBearer('Bearer a', 'TEST_SECRET').ok).toBe(true);
    expect(validateBearer('Bearer b', 'TEST_SECRET').ok).toBe(true);
    // vazio não deve virar match implícito
    expect(validateBearer('Bearer ', 'TEST_SECRET').ok).toBe(false);
  });

  it('três secrets simultâneos (edge case overlap)', () => {
    vi.stubEnv('TEST_SECRET', 'k1,k2,k3');
    expect(validateBearer('Bearer k1', 'TEST_SECRET').ok).toBe(true);
    expect(validateBearer('Bearer k2', 'TEST_SECRET').ok).toBe(true);
    expect(validateBearer('Bearer k3', 'TEST_SECRET').ok).toBe(true);
    expect(validateBearer('Bearer k4', 'TEST_SECRET').ok).toBe(false);
  });
});

describe('validateBearer — security', () => {
  it('inputs adversários não causam throw', () => {
    vi.stubEnv('TEST_SECRET', 'abc');
    expect(() => validateBearer('Bearer ', 'TEST_SECRET')).not.toThrow();
    expect(() => validateBearer('Basic xyz', 'TEST_SECRET')).not.toThrow();
    expect(() => validateBearer('', 'TEST_SECRET')).not.toThrow();
    expect(() => validateBearer('Bearer\t\n\r', 'TEST_SECRET')).not.toThrow();
  });
});
