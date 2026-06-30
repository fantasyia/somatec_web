import { describe, it, expect } from 'vitest';
import { isValidIdempotencyKey } from '@/lib/idempotency';

describe('isValidIdempotencyKey', () => {
  it('aceita UUID v4', () => {
    expect(isValidIdempotencyKey('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });

  it('aceita identificador alfanumérico de 8+ chars', () => {
    expect(isValidIdempotencyKey('abc12345')).toBe(true);
    expect(isValidIdempotencyKey('order_2026-01-01_xyz')).toBe(true);
  });

  it('rejeita chave muito curta (< 8 chars)', () => {
    expect(isValidIdempotencyKey('short')).toBe(false);
    expect(isValidIdempotencyKey('1234567')).toBe(false);
  });

  it('aceita exatamente 8 chars', () => {
    expect(isValidIdempotencyKey('12345678')).toBe(true);
  });

  it('rejeita chave muito longa (> 128 chars)', () => {
    expect(isValidIdempotencyKey('a'.repeat(129))).toBe(false);
  });

  it('aceita exatamente 128 chars', () => {
    expect(isValidIdempotencyKey('a'.repeat(128))).toBe(true);
  });

  it('rejeita caracteres especiais', () => {
    expect(isValidIdempotencyKey('has space here')).toBe(false);
    expect(isValidIdempotencyKey('has/slash/in/it')).toBe(false);
    expect(isValidIdempotencyKey('json {"x":1}')).toBe(false);
    expect(isValidIdempotencyKey("inject'sql")).toBe(false);
  });

  it('aceita underscores, hifens, dois-pontos e ponto', () => {
    expect(isValidIdempotencyKey('a-b_c:d.e1234567')).toBe(true);
  });

  it('rejeita non-string', () => {
    // @ts-expect-error testing runtime behavior
    expect(isValidIdempotencyKey(null)).toBe(false);
    // @ts-expect-error testing runtime behavior
    expect(isValidIdempotencyKey(undefined)).toBe(false);
    // @ts-expect-error testing runtime behavior
    expect(isValidIdempotencyKey(12345678)).toBe(false);
  });
});
