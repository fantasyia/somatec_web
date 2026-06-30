import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signBody, verifySignature } from '@/lib/mullerbot/signing';

describe('signBody', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('retorna null sem secret (env nem param)', () => {
    vi.stubEnv('MULLERBOT_SIGNING_SECRET', '');
    expect(signBody('{}')).toBeNull();
  });

  it('usa MULLERBOT_SIGNING_SECRET da env por padrão', () => {
    vi.stubEnv('MULLERBOT_SIGNING_SECRET', 'env-secret');
    const sig = signBody('{}');
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('param secret tem prioridade sobre env', () => {
    vi.stubEnv('MULLERBOT_SIGNING_SECRET', 'env-secret');
    const sigEnv = signBody('{}');
    const sigParam = signBody('{}', 'param-secret');
    expect(sigEnv).not.toBe(sigParam);
  });

  it('mesma entrada gera mesma assinatura (determinismo)', () => {
    const s1 = signBody('hello', 'k');
    const s2 = signBody('hello', 'k');
    expect(s1).toBe(s2);
  });

  it('body diferente → assinatura diferente', () => {
    const s1 = signBody('a', 'k');
    const s2 = signBody('b', 'k');
    expect(s1).not.toBe(s2);
  });

  it('secret diferente → assinatura diferente', () => {
    const s1 = signBody('x', 'k1');
    const s2 = signBody('x', 'k2');
    expect(s1).not.toBe(s2);
  });
});

describe('verifySignature', () => {
  const SECRET = 'shared-secret-with-receiver';
  const BODY = JSON.stringify({ event: 'submit', id: '123' });
  const SIG = signBody(BODY, SECRET)!;

  it('aceita assinatura correta', () => {
    expect(verifySignature(BODY, SIG, SECRET)).toBe(true);
  });

  it('rejeita assinatura adulterada', () => {
    const tampered = SIG.slice(0, -2) + 'xx';
    expect(verifySignature(BODY, tampered, SECRET)).toBe(false);
  });

  it('rejeita assinatura com secret errado', () => {
    expect(verifySignature(BODY, SIG, 'wrong-secret')).toBe(false);
  });

  it('rejeita body modificado mantendo assinatura original', () => {
    const modifiedBody = BODY.replace('123', '456');
    expect(verifySignature(modifiedBody, SIG, SECRET)).toBe(false);
  });

  it('rejeita signature vazia', () => {
    expect(verifySignature(BODY, '', SECRET)).toBe(false);
  });

  it('rejeita secret vazio', () => {
    expect(verifySignature(BODY, SIG, '')).toBe(false);
  });

  it('rejeita assinatura sem prefixo sha256=', () => {
    const noPrefix = SIG.replace('sha256=', '');
    expect(verifySignature(BODY, noPrefix, SECRET)).toBe(false);
  });

  it('rejeita assinatura com comprimento diferente (sem crash)', () => {
    expect(verifySignature(BODY, 'sha256=abc', SECRET)).toBe(false);
    expect(verifySignature(BODY, 'sha256=' + 'a'.repeat(63), SECRET)).toBe(false);
    expect(verifySignature(BODY, 'sha256=' + 'a'.repeat(65), SECRET)).toBe(false);
  });

  it('é tolerante a ataques de timing (não throws com inputs adversários)', () => {
    expect(() => verifySignature('', 'sha256=', SECRET)).not.toThrow();
    expect(() => verifySignature('x', 'completely-malformed', SECRET)).not.toThrow();
  });
});
