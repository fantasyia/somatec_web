import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Importação dinâmica para resetar o estado (parsed cache) entre testes
async function freshReporter() {
  vi.resetModules();
  return await import('@/lib/error-reporter');
}

describe('reportError', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('vira no-op quando SENTRY_DSN ausente', async () => {
    vi.stubEnv('SENTRY_DSN', '');
    const { reportError } = await freshReporter();
    reportError(new Error('boom'));
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('vira no-op com DSN malformada', async () => {
    vi.stubEnv('SENTRY_DSN', 'not-a-url');
    const { reportError } = await freshReporter();
    reportError(new Error('boom'));
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('envia envelope para URL correta', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://abc123@o12345.ingest.sentry.io/678901');
    const { reportError } = await freshReporter();
    reportError(new Error('boom'));
    await new Promise((r) => setTimeout(r, 10));

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://o12345.ingest.sentry.io/api/678901/envelope/');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/x-sentry-envelope');
    expect(headers['X-Sentry-Auth']).toContain('sentry_key=abc123');
  });

  it('envelope contém event_id, type=event e mensagem', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://k@h/1');
    const { reportError } = await freshReporter();
    reportError(new Error('falhou geral'));
    await new Promise((r) => setTimeout(r, 10));

    const [, init] = fetchSpy.mock.calls[0]!;
    const envelope = init.body as string;
    const lines = envelope.split('\n');
    expect(lines).toHaveLength(3);

    const header = JSON.parse(lines[0]!);
    const itemHeader = JSON.parse(lines[1]!);
    const event = JSON.parse(lines[2]!);

    expect(header.event_id).toMatch(/^[a-f0-9]{32}$/);
    expect(itemHeader.type).toBe('event');
    expect(event.exception.values[0].value).toBe('falhou geral');
    expect(event.exception.values[0].type).toBe('Error');
  });

  it('inclui tags, extra, user, scope', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://k@h/1');
    const { reportError } = await freshReporter();
    reportError(new Error('x'), {
      scope: 'forms',
      tags: { route: '/api/forms/submit' },
      extra: { ip: '1.2.3.4' },
      user: { id: 'u1', email: 'u@msm.com.br' },
    });
    await new Promise((r) => setTimeout(r, 10));

    const event = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body!.toString().split('\n')[2]!);
    expect(event.tags.scope).toBe('forms');
    expect(event.tags.route).toBe('/api/forms/submit');
    expect(event.extra.ip).toBe('1.2.3.4');
    expect(event.user.email).toBe('u@msm.com.br');
  });

  it('lida com não-Error (string thrown)', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://k@h/1');
    const { reportError } = await freshReporter();
    reportError('string error');
    await new Promise((r) => setTimeout(r, 10));

    const event = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body!.toString().split('\n')[2]!);
    expect(event.exception.values[0].type).toBe('NonError');
    expect(event.exception.values[0].value).toBe('string error');
  });

  it('não lança quando fetch rejeita (fire-and-forget seguro)', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://k@h/1');
    fetchSpy.mockRejectedValue(new Error('network'));
    const { reportError } = await freshReporter();
    expect(() => reportError(new Error('boom'))).not.toThrow();
  });
});
