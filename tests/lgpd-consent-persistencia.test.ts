import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// A rota /api/lgpd/consent GRAVA a prova, ou RECUSA — nunca responde ok à toa.
//
// Até 13/09 ela só mandava pro MULLERBOT_WEBHOOK_URL (CRM legado, env
// inexistente) e respondia `ok: true` sem gravar nada. Agora a metade durável
// (tabela lgpd_consent no Supabase) é obrigatória: se o insert falhar, ou não
// houver banco, a resposta é 503. O espelho no Betinna é best-effort e não é
// exercitado aqui.
// =============================================================================

const insert = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({ insert: (...a: unknown[]) => insert(...a) }),
  }),
}));

vi.mock('@/lib/lgpd', () => ({
  getLgpdConsentText: async () => ({ version: 'v1', text: 'texto do banner' }),
}));

// idempotência desligada nestes casos (sem header) — não precisa de Redis.
const ORIGINAL = { ...process.env };

function req(body: unknown): Request {
  return new Request('https://www.somatecblocking.com.br/api/lgpd/consent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'vitest' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://iwtltrzpzidehumypepy.supabase.co';
  delete process.env.BETINNA_CONSENT_URL; // sem espelho
  insert.mockResolvedValue({ error: null });
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.clearAllMocks();
});

describe('POST /api/lgpd/consent', () => {
  it('grava e responde 200 quando o insert vai bem', async () => {
    const { POST } = await import('@/app/api/lgpd/consent/route');
    const res = await POST(req({ accepted: true }) as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledOnce();
    const gravado = insert.mock.calls[0][0];
    expect(gravado).toMatchObject({ accepted: true, text_version: 'v1', origem: 'cookie_banner' });
    expect(gravado.text_hash).toMatch(/^[0-9a-f]{64}$/); // sha256 do texto
  });

  it('503 quando o insert falha — nunca ok sem prova', async () => {
    insert.mockResolvedValue({ error: { message: 'timeout' } });
    const { POST } = await import('@/app/api/lgpd/consent/route');
    const res = await POST(req({ accepted: false }) as never);
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('503 quando não há banco configurado (não finge que gravou)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { POST } = await import('@/app/api/lgpd/consent/route');
    const res = await POST(req({ accepted: true }) as never);
    expect(res.status).toBe(503);
    expect(insert).not.toHaveBeenCalled();
  });

  it('400 quando accepted não é booleano', async () => {
    const { POST } = await import('@/app/api/lgpd/consent/route');
    const res = await POST(req({ accepted: 'sim' }) as never);
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
});
