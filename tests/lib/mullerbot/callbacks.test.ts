import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  callbackPayloadSchema,
  ingestCallback,
  KNOWN_EVENT_TYPES,
  type CallbackPayload,
} from '@/lib/mullerbot/callbacks';

const { singleMock, insertMock, fromMock } = vi.hoisted(() => {
  const singleMock = vi.fn();
  const insertMock = vi.fn(() => ({ select: () => ({ single: singleMock }) }));
  const fromMock = vi.fn(() => ({ insert: insertMock }));
  return { singleMock, insertMock, fromMock };
});
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({ from: fromMock }),
}));

describe('callbackPayloadSchema', () => {
  it('aceita payload mínimo', () => {
    const r = callbackPayloadSchema.safeParse({
      event_type: 'lead_received',
      idempotency_key: 'abc12345',
    });
    expect(r.success).toBe(true);
  });

  it('aceita payload completo', () => {
    const r = callbackPayloadSchema.safeParse({
      event_type: 'lead_responded',
      idempotency_key: 'order-2026-01-01-xyz',
      timestamp: '2026-05-17T10:00:00.000Z',
      data: { lead_id: 'xyz', operator: 'maria' },
    });
    expect(r.success).toBe(true);
  });

  it('rejeita event_type vazio', () => {
    expect(
      callbackPayloadSchema.safeParse({ event_type: '', idempotency_key: 'abc12345' }).success,
    ).toBe(false);
  });

  it('rejeita event_type > 40 chars', () => {
    expect(
      callbackPayloadSchema.safeParse({ event_type: 'a'.repeat(50), idempotency_key: 'abc12345' }).success,
    ).toBe(false);
  });

  it('rejeita idempotency_key curta', () => {
    expect(
      callbackPayloadSchema.safeParse({ event_type: 'x', idempotency_key: 'short' }).success,
    ).toBe(false);
  });

  it('rejeita idempotency_key com caracteres especiais', () => {
    expect(
      callbackPayloadSchema.safeParse({ event_type: 'x', idempotency_key: 'has space12345' }).success,
    ).toBe(false);
    expect(
      callbackPayloadSchema.safeParse({ event_type: 'x', idempotency_key: 'has/slash12345' }).success,
    ).toBe(false);
  });

  it('rejeita timestamp não-ISO', () => {
    expect(
      callbackPayloadSchema.safeParse({
        event_type: 'x',
        idempotency_key: 'abc12345',
        timestamp: '2026-05-17 10:00:00',
      }).success,
    ).toBe(false);
  });

  it('aceita data como objeto arbitrário', () => {
    const r = callbackPayloadSchema.safeParse({
      event_type: 'x',
      idempotency_key: 'abc12345',
      data: { nested: { foo: 'bar' }, count: 42, enabled: true },
    });
    expect(r.success).toBe(true);
  });
});

describe('KNOWN_EVENT_TYPES', () => {
  it('inclui os 5 tipos esperados', () => {
    expect(KNOWN_EVENT_TYPES).toContain('lead_received');
    expect(KNOWN_EVENT_TYPES).toContain('lead_responded');
    expect(KNOWN_EVENT_TYPES).toContain('delivery_failed');
    expect(KNOWN_EVENT_TYPES).toContain('lead_completed');
    expect(KNOWN_EVENT_TYPES).toContain('lead_cancelled');
  });
});

// =============================================================================
// ingestCallback — o caminho que grava o callback do MullerBot.
//
// A idempotência aqui não é opcional: o MullerBot reenvia o mesmo evento quando
// não recebe 200 a tempo. Duplicata TEM que virar sucesso silencioso, senão o
// retry vira erro e o evento fica preso na fila pra sempre.
// =============================================================================

const payload: CallbackPayload = {
  event_type: 'lead_received',
  idempotency_key: 'lead-2026-08-25-abc',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ingestCallback', () => {
  it('grava e devolve o id quando é a primeira vez', async () => {
    singleMock.mockResolvedValue({ data: { id: 'row-1' }, error: null });

    await expect(ingestCallback(payload, true, '203.0.113.10')).resolves.toEqual({
      mode: 'inserted',
      id: 'row-1',
    });
    expect(fromMock).toHaveBeenCalledWith('mullerbot_callbacks');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotency_key: 'lead-2026-08-25-abc',
        event_type: 'lead_received',
        source_ip: '203.0.113.10',
        signature_ok: true,
      }),
    );
  });

  it('guarda signature_ok=false em vez de recusar — quem decide é a rota', async () => {
    singleMock.mockResolvedValue({ data: { id: 'row-2' }, error: null });

    await ingestCallback(payload, false, null);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ signature_ok: false, source_ip: null }),
    );
  });

  it('trata unique_violation (23505) como duplicata, não como erro', async () => {
    singleMock.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } });

    await expect(ingestCallback(payload, true, null)).resolves.toEqual({ mode: 'duplicate' });
  });

  it('devolve erro quando o banco recusa por outro motivo', async () => {
    singleMock.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } });

    await expect(ingestCallback(payload, true, null)).resolves.toEqual({
      mode: 'error',
      message: 'permission denied',
    });
  });

  it('devolve erro genérico quando o banco não explica', async () => {
    singleMock.mockResolvedValue({ data: null, error: { code: '42501' } });

    await expect(ingestCallback(payload, true, null)).resolves.toEqual({
      mode: 'error',
      message: 'insert failed',
    });
  });

  it('não estoura quando o cliente do banco lança', async () => {
    singleMock.mockRejectedValue(new Error('connection reset'));

    await expect(ingestCallback(payload, true, null)).resolves.toEqual({
      mode: 'error',
      message: 'connection reset',
    });
  });

  it('não estoura quando o que foi lançado nem é Error', async () => {
    singleMock.mockRejectedValue('boom');

    await expect(ingestCallback(payload, true, null)).resolves.toEqual({
      mode: 'error',
      message: 'unknown',
    });
  });
});
