import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendToMullerBot } from '@/lib/mullerbot/client';
import type { MullerBotPayload } from '@/lib/mullerbot/payload';

const dummyPayload: MullerBotPayload = {
  form_type: 'b2b',
  name: 'Test',
  email: 'test@example.com',
  whatsapp: '+5511999999999',
  interest_type: 'b2b',
  company: null,
  city: null,
  state: null,
  message: null,
  extra_fields: {},
  source_page: '/contato',
  lgpd_consent: {
    accepted: true,
    timestamp: '2026-01-01T00:00:00Z',
    ip: '0.0.0.0',
    text_version: 'v1.0',
    text_hash: 'abc',
  },
  captcha_token: 'tk',
  captcha_unverified: false,
  site_metadata: {
    user_agent: 'TestAgent',
    referer: null,
    submitted_at: '2026-01-01T00:00:00Z',
  },
};

describe('sendToMullerBot', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('MULLERBOT_WEBHOOK_URL', 'https://hook.test/webhook');
    vi.stubEnv('MULLERBOT_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('retorna not_configured quando webhook URL ausente', async () => {
    vi.stubEnv('MULLERBOT_WEBHOOK_URL', '');
    const result = await sendToMullerBot(dummyPayload, 'idem-1');
    expect(result.result).toBe('not_configured');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('retorna not_configured quando API key ausente', async () => {
    vi.stubEnv('MULLERBOT_API_KEY', '');
    const result = await sendToMullerBot(dummyPayload, 'idem-2');
    expect(result.result).toBe('not_configured');
  });

  it('retorna sent em 200 OK com external_id no body', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ external_id: 'ext-123' }), { status: 200 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-3');
    expect(result.result).toBe('sent');
    if (result.result === 'sent') {
      expect(result.status).toBe(200);
      expect(result.externalId).toBe('ext-123');
    }
  });

  it('retorna sent em 200 OK sem external_id', async () => {
    fetchSpy.mockResolvedValue(new Response('OK', { status: 200 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-4');
    expect(result.result).toBe('sent');
    if (result.result === 'sent') {
      expect(result.externalId).toBeNull();
    }
  });

  it('retorna sent em 201 Created', async () => {
    fetchSpy.mockResolvedValue(new Response('', { status: 201 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-5');
    expect(result.result).toBe('sent');
  });

  it('retorna client_error em 400 (não retry)', async () => {
    fetchSpy.mockResolvedValue(new Response('bad payload', { status: 400 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-6');
    expect(result.result).toBe('client_error');
    if (result.result === 'client_error') {
      expect(result.status).toBe(400);
      expect(result.body).toBe('bad payload');
    }
  });

  it('retorna client_error em 401', async () => {
    fetchSpy.mockResolvedValue(new Response('unauthorized', { status: 401 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-7');
    expect(result.result).toBe('client_error');
  });

  it('retorna server_error em 500 (retry)', async () => {
    fetchSpy.mockResolvedValue(new Response('internal', { status: 500 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-8');
    expect(result.result).toBe('server_error');
    if (result.result === 'server_error') {
      expect(result.status).toBe(500);
    }
  });

  it('retorna server_error em 503', async () => {
    fetchSpy.mockResolvedValue(new Response('', { status: 503 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-9');
    expect(result.result).toBe('server_error');
  });

  it('retorna network_error quando fetch throw', async () => {
    fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await sendToMullerBot(dummyPayload, 'idem-10');
    expect(result.result).toBe('network_error');
    if (result.result === 'network_error') {
      expect(result.message).toContain('ECONNREFUSED');
    }
  });

  it('envia headers corretos no fetch', async () => {
    fetchSpy.mockResolvedValue(new Response('', { status: 200 }));
    await sendToMullerBot(dummyPayload, 'idem-headers');
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [, init] = fetchSpy.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-key');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Source']).toBe('msm-site');
    expect(headers['X-Idempotency-Key']).toBe('idem-headers');
    expect(headers['X-Timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('trunca body de erro a 500 chars', async () => {
    const longBody = 'a'.repeat(2000);
    fetchSpy.mockResolvedValue(new Response(longBody, { status: 400 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-trunc');
    expect(result.result).toBe('client_error');
    if (result.result === 'client_error') {
      expect(result.body).toHaveLength(500);
    }
  });

  it('lida com body não-JSON em 200 sem crashar', async () => {
    fetchSpy.mockResolvedValue(new Response('plain text response', { status: 200 }));
    const result = await sendToMullerBot(dummyPayload, 'idem-nojson');
    expect(result.result).toBe('sent');
    if (result.result === 'sent') {
      expect(result.externalId).toBeNull();
    }
  });

  describe('HMAC signing', () => {
    it('omite X-MSM-Signature quando MULLERBOT_SIGNING_SECRET ausente', async () => {
      vi.stubEnv('MULLERBOT_SIGNING_SECRET', '');
      fetchSpy.mockResolvedValue(new Response('', { status: 200 }));
      await sendToMullerBot(dummyPayload, 'idem-nosig');
      const [, init] = fetchSpy.mock.calls[0]!;
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers['X-MSM-Signature']).toBeUndefined();
    });

    it('inclui X-MSM-Signature sha256=<hex> quando secret configurado', async () => {
      vi.stubEnv('MULLERBOT_SIGNING_SECRET', 'super-secret-key');
      fetchSpy.mockResolvedValue(new Response('', { status: 200 }));
      await sendToMullerBot(dummyPayload, 'idem-sig');
      const [, init] = fetchSpy.mock.calls[0]!;
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers['X-MSM-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it('assinatura é estável para o mesmo body', async () => {
      vi.stubEnv('MULLERBOT_SIGNING_SECRET', 'k');
      fetchSpy.mockResolvedValue(new Response('', { status: 200 }));
      await sendToMullerBot(dummyPayload, 'idem-a');
      await sendToMullerBot(dummyPayload, 'idem-b');
      const sig1 = (fetchSpy.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
      const sig2 = (fetchSpy.mock.calls[1]![1] as RequestInit).headers as Record<string, string>;
      expect(sig1['X-MSM-Signature']).toBe(sig2['X-MSM-Signature']);
    });

    it('assinatura difere quando secret muda', async () => {
      fetchSpy.mockResolvedValue(new Response('', { status: 200 }));

      vi.stubEnv('MULLERBOT_SIGNING_SECRET', 'key-A');
      await sendToMullerBot(dummyPayload, 'idem-1');

      vi.stubEnv('MULLERBOT_SIGNING_SECRET', 'key-B');
      await sendToMullerBot(dummyPayload, 'idem-2');

      const sigA = ((fetchSpy.mock.calls[0]![1] as RequestInit).headers as Record<string, string>)['X-MSM-Signature'];
      const sigB = ((fetchSpy.mock.calls[1]![1] as RequestInit).headers as Record<string, string>)['X-MSM-Signature'];
      expect(sigA).not.toBe(sigB);
    });
  });
});
