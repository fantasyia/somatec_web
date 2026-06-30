import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyTurnstile } from '@/lib/turnstile/verify';

describe('verifyTurnstile', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    warnSpy.mockRestore();
  });

  describe('sem TURNSTILE_SECRET_KEY', () => {
    beforeEach(() => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    });

    it('em produção: bloqueia (defesa preventiva)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const result = await verifyTurnstile('any-token');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('turnstile_not_configured_prod');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('em dev: pula validação', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await verifyTurnstile('any-token');
      expect(result.ok).toBe(true);
      if (result.ok && result.mode === 'skipped') {
        expect(result.reason).toBe('no_secret_dev');
      }
    });
  });

  describe('com TURNSTILE_SECRET_KEY', () => {
    beforeEach(() => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('rejeita token ausente', async () => {
      const result = await verifyTurnstile(undefined);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('missing_token');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejeita token vazio', async () => {
      const result = await verifyTurnstile('');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('missing_token');
    });

    it('verified em success: true', async () => {
      fetchSpy.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
      const result = await verifyTurnstile('valid-token');
      expect(result.ok).toBe(true);
      if (result.ok && result.mode === 'verified') {
        expect(result.mode).toBe('verified');
      }
    });

    it('rejeita success: false com error-codes (token inválido — NÃO é infraFailure)', async () => {
      fetchSpy.mockResolvedValue(new Response(
        JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }),
        { status: 200 },
      ));
      const result = await verifyTurnstile('bad-token');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain('invalid-input-response');
        expect(result.infraFailure).toBeFalsy();
      }
    });

    it('rejeita verify_http_500 em response não-OK (infraFailure → fail-open)', async () => {
      fetchSpy.mockResolvedValue(new Response('', { status: 500 }));
      const result = await verifyTurnstile('token');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('verify_http_500');
        expect(result.infraFailure).toBe(true);
      }
    });

    it('rejeita verify_exception quando fetch throw (infraFailure → fail-open)', async () => {
      fetchSpy.mockRejectedValue(new Error('network down'));
      const result = await verifyTurnstile('token');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('verify_exception');
        expect(result.infraFailure).toBe(true);
      }
    });

    it('envia remoteip quando fornecido', async () => {
      fetchSpy.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
      await verifyTurnstile('token', '10.0.0.5');
      const [, init] = fetchSpy.mock.calls[0]!;
      const bodyParams = init.body as URLSearchParams;
      expect(bodyParams.get('secret')).toBe('test-secret');
      expect(bodyParams.get('response')).toBe('token');
      expect(bodyParams.get('remoteip')).toBe('10.0.0.5');
    });

    it('não envia remoteip quando não fornecido', async () => {
      fetchSpy.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
      await verifyTurnstile('token');
      const [, init] = fetchSpy.mock.calls[0]!;
      const bodyParams = init.body as URLSearchParams;
      expect(bodyParams.get('remoteip')).toBeNull();
    });
  });
});
