import { describe, it, expect } from 'vitest';
import { evaluateAlerts } from '@/lib/alerts/monitor';

describe('evaluateAlerts — Supabase', () => {
  it('supabase down → critical alert', () => {
    const alerts = evaluateAlerts({
      queue: null,
      supabase: { ok: false, latency_ms: 100, error: 'connection refused' },
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.key).toBe('supabase.down');
    expect(alerts[0]!.severity).toBe('critical');
    expect(alerts[0]!.message).toContain('connection refused');
  });

  it('supabase lento (>3000ms default) → warning', () => {
    const alerts = evaluateAlerts({
      queue: null,
      supabase: { ok: true, latency_ms: 4000 },
    });
    expect(alerts.find((a) => a.key === 'supabase.slow')).toBeDefined();
    expect(alerts.find((a) => a.key === 'supabase.slow')?.severity).toBe('warning');
  });

  it('supabase saudável (latência baixa) → nenhum alerta', () => {
    const alerts = evaluateAlerts({
      queue: null,
      supabase: { ok: true, latency_ms: 300 },
    });
    expect(alerts).toHaveLength(0);
  });
});

describe('evaluateAlerts — Queue dead', () => {
  it('dead < 10 → nenhum alerta', () => {
    const alerts = evaluateAlerts({
      queue: { pending: 0, failed: 0, dead: 5, oldest_pending_age_seconds: null },
      supabase: { ok: true, latency_ms: 100 },
    });
    expect(alerts.find((a) => a.key.startsWith('queue.dead'))).toBeUndefined();
  });

  it('dead >= 10 → warning', () => {
    const alerts = evaluateAlerts({
      queue: { pending: 0, failed: 0, dead: 15, oldest_pending_age_seconds: null },
      supabase: { ok: true, latency_ms: 100 },
    });
    const warn = alerts.find((a) => a.key === 'queue.dead.warning');
    expect(warn?.severity).toBe('warning');
    expect(warn?.message).toContain('15');
  });

  it('dead >= 50 → critical (não dispara também o warning)', () => {
    const alerts = evaluateAlerts({
      queue: { pending: 0, failed: 0, dead: 75, oldest_pending_age_seconds: null },
      supabase: { ok: true, latency_ms: 100 },
    });
    const crit = alerts.find((a) => a.key === 'queue.dead.critical');
    const warn = alerts.find((a) => a.key === 'queue.dead.warning');
    expect(crit?.severity).toBe('critical');
    expect(warn).toBeUndefined();
  });
});

describe('evaluateAlerts — Queue oldest pending', () => {
  it('oldest < 15min → nenhum alerta', () => {
    const alerts = evaluateAlerts({
      queue: { pending: 1, failed: 0, dead: 0, oldest_pending_age_seconds: 300 },
      supabase: { ok: true, latency_ms: 100 },
    });
    expect(alerts.find((a) => a.key.startsWith('queue.pending') || a.key.startsWith('queue.cron'))).toBeUndefined();
  });

  it('oldest >= 15min → warning queue.pending.aging', () => {
    const alerts = evaluateAlerts({
      queue: { pending: 1, failed: 0, dead: 0, oldest_pending_age_seconds: 1800 },
      supabase: { ok: true, latency_ms: 100 },
    });
    expect(alerts.find((a) => a.key === 'queue.pending.aging')?.severity).toBe('warning');
  });

  it('oldest >= 1h → critical queue.cron.stuck', () => {
    const alerts = evaluateAlerts({
      queue: { pending: 1, failed: 0, dead: 0, oldest_pending_age_seconds: 7200 },
      supabase: { ok: true, latency_ms: 100 },
    });
    const crit = alerts.find((a) => a.key === 'queue.cron.stuck');
    expect(crit?.severity).toBe('critical');
    expect(crit?.message).toContain('7200');
  });

  it('queue == null → nenhum alerta de queue', () => {
    const alerts = evaluateAlerts({
      queue: null,
      supabase: { ok: true, latency_ms: 100 },
    });
    expect(alerts.filter((a) => a.key.startsWith('queue'))).toHaveLength(0);
  });
});

describe('evaluateAlerts — múltiplos disparos simultâneos', () => {
  it('supabase down + queue dead + cron stuck → 3 alerts', () => {
    const alerts = evaluateAlerts({
      queue: { pending: 1, failed: 0, dead: 75, oldest_pending_age_seconds: 7200 },
      supabase: { ok: false, latency_ms: 5000, error: 'timeout' },
    });
    expect(alerts).toHaveLength(3);
    const keys = alerts.map((a) => a.key);
    expect(keys).toContain('supabase.down');
    expect(keys).toContain('queue.dead.critical');
    expect(keys).toContain('queue.cron.stuck');
  });

  it('todos os alerts incluem context estruturado para webhook', () => {
    const alerts = evaluateAlerts({
      queue: { pending: 0, failed: 0, dead: 75, oldest_pending_age_seconds: null },
      supabase: { ok: true, latency_ms: 100 },
    });
    for (const a of alerts) {
      expect(a.context).toBeDefined();
      expect(typeof a.title).toBe('string');
      expect(typeof a.message).toBe('string');
      expect(['warning', 'critical']).toContain(a.severity);
    }
  });
});
