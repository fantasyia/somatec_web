import { describe, it, expect } from 'vitest';
import { rateLimitHeaders } from '@/lib/ratelimit/headers';

describe('rateLimitHeaders', () => {
  it('mode skipped: só header informativo', () => {
    const h = rateLimitHeaders({ allowed: true, remaining: -1, reset: 0, mode: 'skipped' });
    expect(h['X-RateLimit-Mode']).toBe('skipped');
    expect(h['Retry-After']).toBeUndefined();
    expect(h['X-RateLimit-Remaining']).toBeUndefined();
  });

  it('mode enforced + allowed: X-RateLimit-Remaining + Reset, sem Retry-After', () => {
    const futureMs = Date.now() + 60_000;
    const h = rateLimitHeaders({ allowed: true, remaining: 3, reset: futureMs, mode: 'enforced' });
    expect(h['X-RateLimit-Mode']).toBe('enforced');
    expect(h['X-RateLimit-Remaining']).toBe('3');
    expect(h['X-RateLimit-Reset']).toBe(String(Math.ceil(futureMs / 1000)));
    expect(h['Retry-After']).toBeUndefined();
  });

  it('mode enforced + denied: inclui Retry-After', () => {
    const futureMs = Date.now() + 120_000;
    const h = rateLimitHeaders({ allowed: false, remaining: 0, reset: futureMs, mode: 'enforced' });
    expect(h['Retry-After']).toBeDefined();
    const ra = Number(h['Retry-After']);
    expect(ra).toBeGreaterThan(0);
    expect(ra).toBeLessThanOrEqual(121); // +1 por causa do Math.ceil
  });

  it('Retry-After mínimo 1 mesmo se reset estiver no passado', () => {
    const pastMs = Date.now() - 5_000;
    const h = rateLimitHeaders({ allowed: false, remaining: 0, reset: pastMs, mode: 'enforced' });
    expect(Number(h['Retry-After'])).toBe(1);
  });

  it('omite headers quando reset=0', () => {
    const h = rateLimitHeaders({ allowed: false, remaining: 0, reset: 0, mode: 'enforced' });
    expect(h['X-RateLimit-Reset']).toBeUndefined();
    expect(h['Retry-After']).toBeUndefined();
  });

  it('omite remaining quando negativo', () => {
    const h = rateLimitHeaders({ allowed: true, remaining: -1, reset: Date.now() + 1000, mode: 'enforced' });
    expect(h['X-RateLimit-Remaining']).toBeUndefined();
  });
});
