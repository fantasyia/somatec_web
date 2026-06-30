import { describe, it, expect } from 'vitest';
import { computeAttempt, BACKOFF_SECONDS, DEFAULT_MAX_ATTEMPTS } from '@/lib/webhook-queue/backoff';
import type { SendOutcome } from '@/lib/mullerbot/client';

describe('computeAttempt — status decision', () => {
  it('client_error: vai direto pra dead, independente de attempts', () => {
    const outcome: SendOutcome = { result: 'client_error', status: 400, body: 'bad' };
    const r = computeAttempt({ outcome, currentAttempts: 0 });
    expect(r.status).toBe('dead');
  });

  it('client_error com attempts altos: ainda dead (não importa)', () => {
    const outcome: SendOutcome = { result: 'client_error', status: 422, body: 'unprocessable' };
    const r = computeAttempt({ outcome, currentAttempts: 10 });
    expect(r.status).toBe('dead');
  });

  it('server_error em attempts < max: failed (retry)', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: 'oops' };
    const r = computeAttempt({ outcome, currentAttempts: 0 });
    expect(r.status).toBe('failed');
  });

  it('server_error atingindo maxAttempts: dead', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 503, body: '' };
    // currentAttempts=4 → nextAttempts=5 → >= maxAttempts=5 → dead
    const r = computeAttempt({ outcome, currentAttempts: 4, maxAttempts: 5 });
    expect(r.status).toBe('dead');
  });

  it('server_error ainda dentro do limite: failed', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: '' };
    const r = computeAttempt({ outcome, currentAttempts: 3, maxAttempts: 5 });
    expect(r.status).toBe('failed');
  });

  it('network_error: failed (retry)', () => {
    const outcome: SendOutcome = { result: 'network_error', message: 'ECONNRESET' };
    const r = computeAttempt({ outcome, currentAttempts: 0 });
    expect(r.status).toBe('failed');
  });

  it('not_configured: pending (não consome tentativa — config server-side pode voltar)', () => {
    const outcome: SendOutcome = { result: 'not_configured' };
    const r = computeAttempt({ outcome, currentAttempts: 2 });
    expect(r.status).toBe('pending');
    expect(r.attempts).toBe(2);
  });

  it('maxAttempts customizado', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: '' };
    const r = computeAttempt({ outcome, currentAttempts: 2, maxAttempts: 3 });
    expect(r.status).toBe('dead');
  });
});

describe('computeAttempt — attempts increment', () => {
  it('attempts é currentAttempts + 1', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: '' };
    expect(computeAttempt({ outcome, currentAttempts: 0 }).attempts).toBe(1);
    expect(computeAttempt({ outcome, currentAttempts: 3 }).attempts).toBe(4);
  });
});

describe('computeAttempt — backoff', () => {
  it('primeira tentativa usa BACKOFF_SECONDS[0] (60s)', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: '' };
    const r = computeAttempt({ outcome, currentAttempts: 0 });
    expect(r.backoffSec).toBe(BACKOFF_SECONDS[0]);
    expect(r.backoffSec).toBe(60);
  });

  it('segunda tentativa usa BACKOFF_SECONDS[1] (300s)', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: '' };
    const r = computeAttempt({ outcome, currentAttempts: 1 });
    expect(r.backoffSec).toBe(300);
  });

  it('progressão completa: 60, 300, 1800, 7200, 43200', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: '' };
    const expected = [60, 300, 1800, 7200, 43200];
    for (let i = 0; i < expected.length; i++) {
      // maxAttempts alto para não cair em dead antes
      const r = computeAttempt({ outcome, currentAttempts: i, maxAttempts: 100 });
      expect(r.backoffSec, `currentAttempts=${i}`).toBe(expected[i]);
    }
  });

  it('clampa no último valor quando currentAttempts > length', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: '' };
    const r = computeAttempt({ outcome, currentAttempts: 99, maxAttempts: 200 });
    expect(r.backoffSec).toBe(BACKOFF_SECONDS[BACKOFF_SECONDS.length - 1]);
    expect(r.backoffSec).toBe(43200);
  });
});

describe('computeAttempt — lastError formatting', () => {
  it('client_error: "HTTP {status}: {body}"', () => {
    const outcome: SendOutcome = { result: 'client_error', status: 400, body: 'invalid payload' };
    const r = computeAttempt({ outcome, currentAttempts: 0 });
    expect(r.lastError).toBe('HTTP 400: invalid payload');
  });

  it('server_error: "HTTP {status}: {body}"', () => {
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: 'internal' };
    const r = computeAttempt({ outcome, currentAttempts: 0 });
    expect(r.lastError).toBe('HTTP 500: internal');
  });

  it('network_error: "network: {message}"', () => {
    const outcome: SendOutcome = { result: 'network_error', message: 'ECONNRESET' };
    const r = computeAttempt({ outcome, currentAttempts: 0 });
    expect(r.lastError).toBe('network: ECONNRESET');
  });

  it('not_configured: "mullerbot_not_configured"', () => {
    const outcome: SendOutcome = { result: 'not_configured' };
    const r = computeAttempt({ outcome, currentAttempts: 0 });
    expect(r.lastError).toBe('mullerbot_not_configured');
  });
});

describe('computeAttempt — defaults', () => {
  it('usa DEFAULT_MAX_ATTEMPTS=5 quando não fornecido', () => {
    expect(DEFAULT_MAX_ATTEMPTS).toBe(5);
    const outcome: SendOutcome = { result: 'server_error', status: 500, body: '' };
    // currentAttempts=4 → next=5 → >= 5 → dead
    const r = computeAttempt({ outcome, currentAttempts: 4 });
    expect(r.status).toBe('dead');
  });
});
