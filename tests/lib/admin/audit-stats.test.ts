import { describe, it, expect } from 'vitest';
import {
  auditStatsQuerySchema,
  aggregateBy,
  aggregatePerDay,
} from '@/lib/admin/audit-stats';

type Row = {
  action: string | null;
  table_name: string | null;
  user_email: string | null;
  created_at: string;
};

const sampleRows: Row[] = [
  { action: 'create', table_name: 'products', user_email: 'a@x.com', created_at: '2026-05-10T10:00:00Z' },
  { action: 'update', table_name: 'products', user_email: 'a@x.com', created_at: '2026-05-10T11:00:00Z' },
  { action: 'update', table_name: 'brands', user_email: 'b@x.com', created_at: '2026-05-11T09:00:00Z' },
  { action: 'delete', table_name: 'products', user_email: 'a@x.com', created_at: '2026-05-13T14:00:00Z' },
  { action: 'admin_login', table_name: null, user_email: 'a@x.com', created_at: '2026-05-13T14:30:00Z' },
];

describe('auditStatsQuerySchema', () => {
  it('aceita query vazia com defaults', () => {
    const r = auditStatsQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.top).toBe(10);
  });

  it('rejeita top > 50', () => {
    expect(auditStatsQuerySchema.safeParse({ top: 100 }).success).toBe(false);
  });

  it('rejeita top < 1', () => {
    expect(auditStatsQuerySchema.safeParse({ top: 0 }).success).toBe(false);
  });

  it('coerce top de string para int', () => {
    const r = auditStatsQuerySchema.safeParse({ top: '25' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.top).toBe(25);
  });

  it('rejeita from não-ISO', () => {
    expect(auditStatsQuerySchema.safeParse({ from: '2026-05-10' }).success).toBe(false);
  });
});

describe('aggregateBy', () => {
  it('conta e ordena por count desc', () => {
    const r = aggregateBy(sampleRows, 'action', 10);
    expect(r).toEqual([
      { value: 'update', count: 2 },
      { value: 'create', count: 1 },
      { value: 'delete', count: 1 },
      { value: 'admin_login', count: 1 },
    ]);
  });

  it('respeita top-N', () => {
    const r = aggregateBy(sampleRows, 'action', 2);
    expect(r).toHaveLength(2);
    expect(r[0]!.value).toBe('update');
  });

  it('ignora nulls (table_name=null pro admin_login)', () => {
    const r = aggregateBy(sampleRows, 'table_name', 10);
    expect(r).toEqual([
      { value: 'products', count: 3 },
      { value: 'brands', count: 1 },
    ]);
  });

  it('rows vazios retorna []', () => {
    expect(aggregateBy([], 'action', 10)).toEqual([]);
  });

  it('agrupa user_email corretamente', () => {
    const r = aggregateBy(sampleRows, 'user_email', 10);
    expect(r).toEqual([
      { value: 'a@x.com', count: 4 },
      { value: 'b@x.com', count: 1 },
    ]);
  });
});

describe('aggregatePerDay', () => {
  it('agrupa por YYYY-MM-DD UTC', () => {
    const r = aggregatePerDay(sampleRows);
    // 10, 11, 12 (vazio), 13
    expect(r).toHaveLength(4);
    expect(r[0]).toEqual({ date: '2026-05-10', count: 2 });
    expect(r[1]).toEqual({ date: '2026-05-11', count: 1 });
    expect(r[2]).toEqual({ date: '2026-05-12', count: 0 });
    expect(r[3]).toEqual({ date: '2026-05-13', count: 2 });
  });

  it('rows vazios retorna []', () => {
    expect(aggregatePerDay([])).toEqual([]);
  });

  it('um único dia', () => {
    const r = aggregatePerDay([
      { action: 'create', table_name: null, user_email: null, created_at: '2026-05-15T12:00:00Z' },
    ]);
    expect(r).toEqual([{ date: '2026-05-15', count: 1 }]);
  });

  it('múltiplas atividades no mesmo dia somam', () => {
    const r = aggregatePerDay([
      { action: 'a', table_name: null, user_email: null, created_at: '2026-05-15T00:00:00Z' },
      { action: 'b', table_name: null, user_email: null, created_at: '2026-05-15T23:59:00Z' },
    ]);
    expect(r).toEqual([{ date: '2026-05-15', count: 2 }]);
  });
});
