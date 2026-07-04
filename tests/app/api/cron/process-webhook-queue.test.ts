import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { __resetForTests, renderPrometheus } from '@/lib/metrics/registry';

// --- Mocks ---
const fetchDuePendingMock = vi.fn();
const markSentMock = vi.fn();
const markAttemptMock = vi.fn();
const sendToBetinnaMock = vi.fn();

vi.mock('@/lib/webhook-queue', () => ({
  fetchDuePending: (...args: unknown[]) => fetchDuePendingMock(...args),
  markSent: (...args: unknown[]) => markSentMock(...args),
  markAttempt: (...args: unknown[]) => markAttemptMock(...args),
}));

vi.mock('@/lib/betinna/client', () => ({
  sendToBetinna: (...args: unknown[]) => sendToBetinnaMock(...args),
}));

const { GET } = await import('@/app/api/cron/process-webhook-queue/route');

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/cron/process-webhook-queue', {
    method: 'GET',
  });
}

beforeEach(() => {
  __resetForTests();
  fetchDuePendingMock.mockReset();
  markSentMock.mockReset().mockResolvedValue(undefined);
  markAttemptMock.mockReset().mockResolvedValue(undefined);
  sendToBetinnaMock.mockReset();
  vi.unstubAllEnvs();
});

describe('GET /api/cron/process-webhook-queue — métricas', () => {
  it('queue vazia: msm_queue_processed_total não aparece', async () => {
    fetchDuePendingMock.mockResolvedValue([]);
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.processed).toBe(0);
    expect(json.by_outcome).toEqual({});
    expect(renderPrometheus({})).not.toContain('msm_queue_processed_total');
  });

  it('processa 1 sent: incrementa msm_queue_processed_total{outcome=sent} e markSent chamado', async () => {
    fetchDuePendingMock.mockResolvedValue([
      { idempotency_key: 'k1', payload: {}, attempts: 0, max_attempts: 5 },
    ]);
    sendToBetinnaMock.mockResolvedValue({ result: 'sent', status: 200, externalId: 'ext-1' });

    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.sent).toBe(1);
    expect(json.failed).toBe(0);
    expect(json.by_outcome).toEqual({ sent: 1 });
    expect(markSentMock).toHaveBeenCalledOnce();
    expect(renderPrometheus({})).toContain('msm_queue_processed_total{outcome="sent"} 1');
  });

  it('processa 1 server_error: counter + markAttempt (não markSent)', async () => {
    fetchDuePendingMock.mockResolvedValue([
      { idempotency_key: 'k1', payload: {}, attempts: 0, max_attempts: 5 },
    ]);
    sendToBetinnaMock.mockResolvedValue({ result: 'server_error', status: 500, body: 'down' });

    await GET(makeRequest());
    expect(markAttemptMock).toHaveBeenCalledOnce();
    expect(markSentMock).not.toHaveBeenCalled();
    expect(renderPrometheus({})).toContain('msm_queue_processed_total{outcome="server_error"} 1');
  });

  it('mistura outcomes: counters separados por label', async () => {
    fetchDuePendingMock.mockResolvedValue([
      { idempotency_key: 'k1', payload: {}, attempts: 0, max_attempts: 5 },
      { idempotency_key: 'k2', payload: {}, attempts: 1, max_attempts: 5 },
      { idempotency_key: 'k3', payload: {}, attempts: 2, max_attempts: 5 },
      { idempotency_key: 'k4', payload: {}, attempts: 3, max_attempts: 5 },
    ]);
    sendToBetinnaMock
      .mockResolvedValueOnce({ result: 'sent', status: 200 })
      .mockResolvedValueOnce({ result: 'sent', status: 200 })
      .mockResolvedValueOnce({ result: 'client_error', status: 400, body: 'bad' })
      .mockResolvedValueOnce({ result: 'network_error', message: 'ECONNRESET' });

    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.processed).toBe(4);
    expect(json.sent).toBe(2);
    expect(json.failed).toBe(2);
    expect(json.by_outcome).toEqual({ sent: 2, client_error: 1, network_error: 1 });

    const metrics = renderPrometheus({});
    expect(metrics).toContain('msm_queue_processed_total{outcome="sent"} 2');
    expect(metrics).toContain('msm_queue_processed_total{outcome="client_error"} 1');
    expect(metrics).toContain('msm_queue_processed_total{outcome="network_error"} 1');
  });

  it('not_configured: marca attempt mas não cresta como erro fatal', async () => {
    fetchDuePendingMock.mockResolvedValue([
      { idempotency_key: 'k1', payload: {}, attempts: 0, max_attempts: 5 },
    ]);
    sendToBetinnaMock.mockResolvedValue({ result: 'not_configured' });

    await GET(makeRequest());
    expect(renderPrometheus({})).toContain('msm_queue_processed_total{outcome="not_configured"} 1');
  });
});
