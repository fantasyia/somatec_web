import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks de dependências ---
// Mock Supabase admin: enqueueSubmission e markSent fazem .from(table).insert/update
const insertMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn();
const eqMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      insert: (...args: unknown[]) => insertMock(...args),
      update: (...args: unknown[]) => {
        updateMock(...args);
        return { eq: eqMock };
      },
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
      }),
    }),
  }),
}));

// Mock LGPD (evita Supabase real)
vi.mock('@/lib/lgpd', () => ({
  getLgpdConsentText: vi.fn().mockResolvedValue({ version: 'v1.0', text: 'Texto LGPD' }),
}));

// Mock ratelimit (Upstash não configurado vira allow)
vi.mock('@/lib/ratelimit/upstash', () => ({
  limitFormSubmit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, reset: 0, mode: 'skipped' }),
}));

// Mock idempotency: usaremos vi.mocked() para configurar comportamento por teste
const checkIdempotencyMock = vi.fn().mockResolvedValue({ mode: 'skipped' as const });
const storeResponseMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/idempotency', async () => {
  const actual = await vi.importActual<typeof import('@/lib/idempotency')>('@/lib/idempotency');
  return {
    ...actual,
    checkIdempotency: (...args: unknown[]) => checkIdempotencyMock(...args),
    storeResponse: (...args: unknown[]) => storeResponseMock(...args),
  };
});

// Importação DEPOIS dos mocks
const { POST } = await import('@/app/api/forms/submit/route');

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/forms/submit', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'TestAgent/1.0',
      'x-forwarded-for': '10.0.0.1',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const validBody = {
  form_type: 'b2b',
  interest_type: 'b2b',
  name: 'Test User',
  email: 'test@example.com',
  whatsapp: '11987654321',
  lgpd_consent: true,
  company: 'Acme',
};

describe('POST /api/forms/submit', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    insertMock.mockClear().mockResolvedValue({ error: null });
    updateMock.mockClear();
    eqMock.mockClear().mockResolvedValue({ error: null });

    fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ external_id: 'ext-1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    // sem TURNSTILE_SECRET → modo dev pula validação
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('MULLERBOT_WEBHOOK_URL', 'https://hook.test/wh');
    vi.stubEnv('MULLERBOT_API_KEY', 'k');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('aceita submit válido, enfileira e marca como sent', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    // enqueueSubmission insertou
    expect(insertMock).toHaveBeenCalledOnce();
    const insertedRow = insertMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(insertedRow.destination).toBe('mullerbot');
    expect(insertedRow.status).toBe('pending');
    expect(insertedRow.source_ip).toBe('10.0.0.1');

    // mullerbot enviou
    expect(fetchSpy).toHaveBeenCalled();
    const mbCall = fetchSpy.mock.calls.find(([url]) => String(url).includes('hook.test'));
    expect(mbCall).toBeDefined();

    // markSent update
    expect(updateMock).toHaveBeenCalled();
    const updateCall = updateMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(updateCall.status).toBe('sent');
  });

  it('retorna 200 sucesso fake quando honeypot preenchido (sem chamar enqueue)', async () => {
    const res = await POST(makeRequest({ ...validBody, website: 'spam.com' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(insertMock).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('retorna 400 com JSON inválido', async () => {
    const res = await POST(makeRequest('{not valid json'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it('retorna 400 com payload inválido (email ruim)', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'not-email' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('retorna 400 quando lgpd_consent ausente', async () => {
    const { lgpd_consent, ...without } = validBody;
    void lgpd_consent;
    const res = await POST(makeRequest(without));
    expect(res.status).toBe(400);
  });

  it('retorna 429 quando rate limit nega', async () => {
    const { limitFormSubmit } = await import('@/lib/ratelimit/upstash');
    vi.mocked(limitFormSubmit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      reset: 0,
      mode: 'enforced',
    });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('retorna 400 quando turnstile bloqueia em produção sem secret', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('turnstile infra failure (prod): fail-open — aceita o lead mesmo sem verificar', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    // siteverify da Cloudflare falha (infra); MullerBot responde ok.
    fetchSpy.mockImplementation((url: unknown) => {
      if (String(url).includes('challenges.cloudflare.com')) {
        return Promise.reject(new Error('cloudflare down'));
      }
      return Promise.resolve(new Response(JSON.stringify({ external_id: 'x' }), { status: 200 }));
    });
    const res = await POST(makeRequest({ ...validBody, captcha_token: 'tk' }));
    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it('retorna 500 quando enqueueSubmission falha', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'DB down' } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });

  it('mesmo se mullerbot falhar (server_error), submit é sucesso pro user', async () => {
    fetchSpy.mockResolvedValue(new Response('boom', { status: 500 }));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    // Fila marcou como failed (não sent)
    expect(updateMock).toHaveBeenCalled();
    const updateCall = updateMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(updateCall.status).toBe('failed');
  });

  it('captura o IP do hop confiável (rightmost), não o leftmost spoofável do x-forwarded-for', async () => {
    await POST(makeRequest(validBody, { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }));
    const insertedRow = insertMock.mock.calls[0]![0] as Record<string, unknown>;
    // 203.0.113.5 (leftmost) é controlado pelo cliente; 10.0.0.1 é o hop anexado pelo proxy.
    expect(insertedRow.source_ip).toBe('10.0.0.1');
  });

  it('source_page é capturado do body', async () => {
    await POST(makeRequest({ ...validBody, source_page: '/contato#b2b' }));
    const insertedRow = insertMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(insertedRow.source_page).toBe('/contato#b2b');
  });

  describe('Idempotency-Key', () => {
    beforeEach(() => {
      checkIdempotencyMock.mockClear();
      storeResponseMock.mockClear();
      checkIdempotencyMock.mockResolvedValue({ mode: 'skipped' as const });
    });

    it('rejeita 400 quando Idempotency-Key tem formato inválido', async () => {
      const res = await POST(makeRequest(validBody, { 'idempotency-key': 'short' }));
      expect(res.status).toBe(400);
      expect(checkIdempotencyMock).not.toHaveBeenCalled();
      expect(insertMock).not.toHaveBeenCalled();
    });

    it('primeira chamada com chave válida: processa normalmente e armazena', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({ mode: 'first' as const });
      const res = await POST(
        makeRequest(validBody, { 'idempotency-key': 'order-2026-01-01-abc' }),
      );
      expect(res.status).toBe(200);
      expect(checkIdempotencyMock).toHaveBeenCalledWith('order-2026-01-01-abc');
      expect(insertMock).toHaveBeenCalledOnce();
      expect(storeResponseMock).toHaveBeenCalledOnce();
      const storedKey = storeResponseMock.mock.calls[0]![0];
      const storedResponse = storeResponseMock.mock.calls[0]![1] as { status: number };
      expect(storedKey).toBe('order-2026-01-01-abc');
      expect(storedResponse.status).toBe(200);
    });

    it('replay com chave conhecida: retorna cache, não processa', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({
        mode: 'replay' as const,
        response: {
          status: 200,
          body: JSON.stringify({ ok: true, message: 'cached!' }),
          contentType: 'application/json',
        },
      });
      const res = await POST(
        makeRequest(validBody, { 'idempotency-key': 'replayed-key-1234' }),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Idempotent-Replay')).toBe('true');
      const json = await res.json();
      expect(json.message).toBe('cached!');
      // não chamou enqueue nem fetch
      expect(insertMock).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storeResponseMock).not.toHaveBeenCalled();
    });

    it('sem header Idempotency-Key: não chama checkIdempotency', async () => {
      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(200);
      expect(checkIdempotencyMock).not.toHaveBeenCalled();
      expect(storeResponseMock).not.toHaveBeenCalled();
    });

    it('mode skipped (Upstash off): processa normalmente sem armazenar', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({ mode: 'skipped' as const });
      const res = await POST(
        makeRequest(validBody, { 'idempotency-key': 'when-redis-down-12' }),
      );
      expect(res.status).toBe(200);
      // skipped: prossegue mas storeResponse roda (no-op no idempotency module se Upstash off)
      expect(insertMock).toHaveBeenCalledOnce();
      expect(storeResponseMock).toHaveBeenCalledOnce();
    });
  });
});
