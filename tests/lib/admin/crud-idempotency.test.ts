import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---
const insertMock = vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null });
const updateMock = vi.fn();
const deleteMock = vi.fn();
const eqMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      insert: (...args: unknown[]) => insertMock(...args),
      update: (...args: unknown[]) => {
        updateMock(...args);
        return { eq: eqMock };
      },
      delete: () => ({ eq: (...args: unknown[]) => { deleteMock(...args); return eqMock(...args); } }),
    }),
  }),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'u1', email: 'admin@msm.com.br' }),
}));

vi.mock('@/lib/admin/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
  getRequestMeta: () => ({ ipAddress: '10.0.0.1', userAgent: 'test' }),
}));

vi.mock('@/lib/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/redirects/cache', () => ({
  invalidateRedirectsCache: vi.fn().mockResolvedValue(undefined),
}));

// Mock idempotency: controlado por teste
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

const { makeCrudHandlers } = await import('@/lib/admin/crud');

function makeRequest(body: unknown, headers: Record<string, string> = {}, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/test', {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  insertMock.mockClear().mockResolvedValue({ data: { id: 'new-id' }, error: null });
  updateMock.mockClear();
  deleteMock.mockClear();
  eqMock.mockClear().mockResolvedValue({ error: null });
  checkIdempotencyMock.mockClear().mockResolvedValue({ mode: 'skipped' as const });
  storeResponseMock.mockClear();
});

describe('makeCrudHandlers — Idempotency-Key', () => {
  const { POST, PUT, DELETE } = makeCrudHandlers({ table: 'banners', labelField: 'title' });

  describe('POST', () => {
    it('rejeita 400 quando Idempotency-Key tem formato inválido', async () => {
      const res = await POST(makeRequest({ title: 'X', location: 'home' }, { 'idempotency-key': 'short' }));
      expect(res.status).toBe(400);
      expect(checkIdempotencyMock).not.toHaveBeenCalled();
      expect(insertMock).not.toHaveBeenCalled();
    });

    it('replay: retorna cache com X-Idempotent-Replay sem insertar', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({
        mode: 'replay' as const,
        response: {
          status: 200,
          body: JSON.stringify({ ok: true, id: 'cached-id' }),
          contentType: 'application/json',
        },
      });
      const res = await POST(makeRequest({ title: 'X', location: 'home' }, { 'idempotency-key': 'replay-key-12345' }));
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Idempotent-Replay')).toBe('true');
      const json = await res.json();
      expect(json.id).toBe('cached-id');
      expect(insertMock).not.toHaveBeenCalled();
      expect(storeResponseMock).not.toHaveBeenCalled();
    });

    it('first: insere normalmente e armazena resposta', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({ mode: 'first' as const });
      const res = await POST(makeRequest({ title: 'New Banner', location: 'home' }, { 'idempotency-key': 'fresh-key-1234' }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe('new-id');
      expect(insertMock).toHaveBeenCalledOnce();
      expect(storeResponseMock).toHaveBeenCalledOnce();
      expect(storeResponseMock.mock.calls[0]![0]).toBe('fresh-key-1234');
    });

    it('in_flight: requisição concorrente com a mesma chave ainda processando → 409 sem insertar', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({ mode: 'in_flight' as const });
      const res = await POST(makeRequest({ title: 'X', location: 'home' }, { 'idempotency-key': 'inflight-key-12' }));
      expect(res.status).toBe(409);
      expect(insertMock).not.toHaveBeenCalled();
      expect(storeResponseMock).not.toHaveBeenCalled();
    });

    it('sem header: processa sem checar idempotency', async () => {
      const res = await POST(makeRequest({ title: 'Sem header', location: 'home' }));
      expect(res.status).toBe(200);
      expect(checkIdempotencyMock).not.toHaveBeenCalled();
      expect(storeResponseMock).not.toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalledOnce();
    });

    it('skipped (Upstash off): processa normalmente, tenta armazenar (no-op no módulo)', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({ mode: 'skipped' as const });
      const res = await POST(makeRequest({ title: 'X', location: 'home' }, { 'idempotency-key': 'redis-off-key1' }));
      expect(res.status).toBe(200);
      expect(insertMock).toHaveBeenCalledOnce();
      expect(storeResponseMock).toHaveBeenCalledOnce();
    });
  });

  describe('PUT', () => {
    it('replay funciona em PUT também', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({
        mode: 'replay' as const,
        response: { status: 200, body: '{"ok":true}', contentType: 'application/json' },
      });
      const res = await PUT(makeRequest({ id: 'abc', title: 'Y' }, { 'idempotency-key': 'put-replay-1234' }, 'PUT'));
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Idempotent-Replay')).toBe('true');
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('fresh: armazena resposta após update', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({ mode: 'first' as const });
      const res = await PUT(makeRequest({ id: 'abc', title: 'Y' }, { 'idempotency-key': 'put-fresh-1234' }, 'PUT'));
      expect(res.status).toBe(200);
      expect(updateMock).toHaveBeenCalledOnce();
      expect(storeResponseMock).toHaveBeenCalledOnce();
    });

    it('Idempotency-Key inválida: 400 antes de tocar no banco', async () => {
      const res = await PUT(makeRequest({ id: 'abc', title: 'Y' }, { 'idempotency-key': 'bad' }, 'PUT'));
      expect(res.status).toBe(400);
      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('replay protege contra double-delete', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({
        mode: 'replay' as const,
        response: { status: 200, body: '{"ok":true}', contentType: 'application/json' },
      });
      const req = new NextRequest('http://localhost:3000/api/admin/test?id=xyz', {
        method: 'DELETE',
        headers: { 'idempotency-key': 'del-replay-1234' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Idempotent-Replay')).toBe('true');
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it('fresh: executa delete e armazena', async () => {
      checkIdempotencyMock.mockResolvedValueOnce({ mode: 'first' as const });
      const req = new NextRequest('http://localhost:3000/api/admin/test?id=xyz', {
        method: 'DELETE',
        headers: { 'idempotency-key': 'del-fresh-1234' },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(200);
      expect(deleteMock).toHaveBeenCalled();
      expect(storeResponseMock).toHaveBeenCalledOnce();
    });
  });
});
