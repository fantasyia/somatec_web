import { describe, it, expect } from 'vitest';
import { callbackPayloadSchema, KNOWN_EVENT_TYPES } from '@/lib/mullerbot/callbacks';

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
