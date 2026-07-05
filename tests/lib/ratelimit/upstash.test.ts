import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

async function freshModule() {
  vi.resetModules();
  return await import('@/lib/ratelimit/upstash');
}

describe('ratelimit fallback mode (sem Upstash)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // getRedis lê REDIS_URL e memoiza no globalThis — resetar p/ isolar cada teste.
    vi.stubEnv('REDIS_URL', '');
    (globalThis as { __somatecRedis?: unknown }).__somatecRedis = undefined;
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('limitFormSubmit: permite todos quando Upstash não configurado', async () => {
    const { limitFormSubmit } = await freshModule();
    const r1 = await limitFormSubmit('1.2.3.4');
    const r2 = await limitFormSubmit('1.2.3.4');
    const r3 = await limitFormSubmit('1.2.3.4');
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r1.mode).toBe('skipped');
  });

  it('limitAdminLogin: permite todos no fallback', async () => {
    const { limitAdminLogin } = await freshModule();
    const r = await limitAdminLogin('1.2.3.4');
    expect(r.allowed).toBe(true);
    expect(r.mode).toBe('skipped');
  });

  it('limitAdminLoginByEmail: permite no fallback', async () => {
    const { limitAdminLoginByEmail } = await freshModule();
    const r = await limitAdminLoginByEmail('admin@msm.com.br');
    expect(r.allowed).toBe(true);
    expect(r.mode).toBe('skipped');
  });

  it('limitAdminLoginByEmail normaliza email (trim + lowercase) sem crashar', async () => {
    const { limitAdminLoginByEmail } = await freshModule();
    const r = await limitAdminLoginByEmail('  ADMIN@MSM.COM.BR  ');
    expect(r.allowed).toBe(true);
  });

  it('init avisa uma única vez no fallback', async () => {
    const { limitFormSubmit, limitAdminLogin, limitAdminLoginByEmail } = await freshModule();
    await limitFormSubmit('ip');
    await limitAdminLogin('ip');
    await limitAdminLoginByEmail('e@x.com');
    // logger usa pretty print em test (NODE_ENV !== 'production'), passa string + objeto
    const calls = warnSpy.mock.calls;
    const messages = calls.map((c: unknown[]) => String(c[0]));
    const fallbackWarns = messages.filter((m: string) => m.includes('REDIS_URL ausente'));
    expect(fallbackWarns.length).toBe(1);
  });
});
