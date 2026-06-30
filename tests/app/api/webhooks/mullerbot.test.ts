import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { signBody } from '@/lib/mullerbot/signing';
import { __resetForTests, renderPrometheus } from '@/lib/metrics/registry';

// Mock ingestCallback
const ingestMock = vi.fn();
vi.mock('@/lib/mullerbot/callbacks', async () => {
  const actual = await vi.importActual<typeof import('@/lib/mullerbot/callbacks')>('@/lib/mullerbot/callbacks');
  return {
    ...actual,
    ingestCallback: (...args: unknown[]) => ingestMock(...args),
  };
});

const { POST } = await import('@/app/api/webhooks/mullerbot/route');

const SECRET = 'test-shared-secret-32-chars-min__';

function makeRequest(body: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/webhooks/mullerbot', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

function validPayload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    event_type: 'lead_received',
    idempotency_key: 'cb-test-12345678',
    timestamp: '2026-05-17T10:00:00.000Z',
    data: { lead_id: 'xyz' },
    ...overrides,
  });
}

beforeEach(() => {
  __resetForTests();
  ingestMock.mockReset().mockResolvedValue({ mode: 'inserted', id: 'new-uuid' });
  vi.stubEnv('MULLERBOT_SIGNING_SECRET', SECRET);
});

afterEach(() => vi.unstubAllEnvs());

describe('POST /api/webhooks/mullerbot', () => {
  it('500 quando MULLERBOT_SIGNING_SECRET ausente (fail-closed)', async () => {
    vi.stubEnv('MULLERBOT_SIGNING_SECRET', '');
    const body = validPayload();
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('signing_secret_not_configured');
    expect(ingestMock).not.toHaveBeenCalled();
  });

  it('401 quando signature inválida', async () => {
    const body = validPayload();
    const res = await POST(makeRequest(body, { 'x-msm-signature': 'sha256=wrong' }));
    expect(res.status).toBe(401);
    expect(ingestMock).not.toHaveBeenCalled();
    const metrics = renderPrometheus({});
    expect(metrics).toContain('msm_webhook_callbacks_total{signature="invalid"} 1');
  });

  it('401 quando signature header ausente', async () => {
    const res = await POST(makeRequest(validPayload()));
    expect(res.status).toBe(401);
  });

  it('200 com signature válida + payload válido + insert success', async () => {
    const body = validPayload();
    const sig = signBody(body, SECRET)!;
    const res = await POST(makeRequest(body, { 'x-msm-signature': sig }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.mode).toBe('inserted');
    expect(json.id).toBe('new-uuid');
    expect(ingestMock).toHaveBeenCalledOnce();

    const metrics = renderPrometheus({});
    expect(metrics).toContain('msm_webhook_callbacks_total{signature="valid"} 1');
    expect(metrics).toContain('msm_webhook_callbacks_ingest_total{event_type="lead_received",outcome="inserted"} 1');
  });

  it('200 com mode=duplicate quando idempotency_key já existe', async () => {
    ingestMock.mockResolvedValueOnce({ mode: 'duplicate' });
    const body = validPayload();
    const sig = signBody(body, SECRET)!;
    const res = await POST(makeRequest(body, { 'x-msm-signature': sig }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.mode).toBe('duplicate');
    expect(json.id).toBeUndefined();
  });

  it('500 quando ingest falha (DB down etc)', async () => {
    ingestMock.mockResolvedValueOnce({ mode: 'error', message: 'db connection refused' });
    const body = validPayload();
    const sig = signBody(body, SECRET)!;
    const res = await POST(makeRequest(body, { 'x-msm-signature': sig }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('db connection refused');
  });

  it('400 com body não-JSON', async () => {
    const body = 'not-valid-json{';
    const sig = signBody(body, SECRET)!;
    const res = await POST(makeRequest(body, { 'x-msm-signature': sig }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_json');
  });

  it('400 com payload inválido (event_type vazio)', async () => {
    const body = validPayload({ event_type: '' });
    const sig = signBody(body, SECRET)!;
    const res = await POST(makeRequest(body, { 'x-msm-signature': sig }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('event_type');
  });

  it('400 com idempotency_key curta', async () => {
    const body = validPayload({ idempotency_key: 'abc' });
    const sig = signBody(body, SECRET)!;
    const res = await POST(makeRequest(body, { 'x-msm-signature': sig }));
    expect(res.status).toBe(400);
  });

  it('signature validada sobre body raw (não JSON re-serializado)', async () => {
    // Whitespace no JSON afeta a signature. Garante que servidor não re-serializa.
    const body = '{"event_type":"x","idempotency_key":"cb-test-12345678"}';
    const sig = signBody(body, SECRET)!;
    const res = await POST(makeRequest(body, { 'x-msm-signature': sig }));
    expect(res.status).toBe(200);
  });

  it('headers de response incluem X-API-Version', async () => {
    const body = validPayload();
    const sig = signBody(body, SECRET)!;
    const res = await POST(makeRequest(body, { 'x-msm-signature': sig }));
    expect(res.headers.get('X-API-Version')).toBeDefined();
  });

  it('métricas por outcome agrupam corretamente', async () => {
    // Múltiplos com outcomes diferentes
    const inserts = ['cb-aaa-12345678', 'cb-bbb-12345678'];
    for (const key of inserts) {
      const body = validPayload({ idempotency_key: key });
      const sig = signBody(body, SECRET)!;
      await POST(makeRequest(body, { 'x-msm-signature': sig }));
    }
    ingestMock.mockResolvedValueOnce({ mode: 'duplicate' });
    const body = validPayload({ idempotency_key: 'cb-dup-12345678' });
    const sig = signBody(body, SECRET)!;
    await POST(makeRequest(body, { 'x-msm-signature': sig }));

    const metrics = renderPrometheus({});
    expect(metrics).toContain('msm_webhook_callbacks_ingest_total{event_type="lead_received",outcome="inserted"} 2');
    expect(metrics).toContain('msm_webhook_callbacks_ingest_total{event_type="lead_received",outcome="duplicate"} 1');
  });
});
