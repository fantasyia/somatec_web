import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditQuerySchema, toCsv } from '@/lib/admin/audit-query';
import type { AdminActivityLog } from '@/types/database';

// Mock Supabase para queryAuditTrail
const builderCalls: Record<string, unknown[][]> = {};
const orderMock = vi.fn();
const rangeMock = vi.fn();
const gteMock = vi.fn();
const lteMock = vi.fn();
const eqMock = vi.fn();

function chainBuilder(finalResult: { data: unknown; count: number | null; error: unknown }) {
  builderCalls.eq = [];
  builderCalls.gte = [];
  builderCalls.lte = [];

  const chain: Record<string, unknown> = {};
  chain.order = (...a: unknown[]) => {
    builderCalls.order = [a];
    return chain;
  };
  chain.range = (...a: unknown[]) => {
    builderCalls.range = [a];
    return Object.assign(Promise.resolve(finalResult), chain);
  };
  chain.gte = (...a: unknown[]) => {
    builderCalls.gte!.push(a);
    return chain;
  };
  chain.lte = (...a: unknown[]) => {
    builderCalls.lte!.push(a);
    return chain;
  };
  chain.eq = (...a: unknown[]) => {
    builderCalls.eq!.push(a);
    return chain;
  };
  return chain;
}

const selectMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      select: (...args: unknown[]) => {
        selectMock(...args);
        return Reflect.get(globalThis, '__nextChain');
      },
    }),
  }),
}));

const { queryAuditTrail } = await import('@/lib/admin/audit-query');

beforeEach(() => {
  selectMock.mockClear();
  orderMock.mockClear();
  rangeMock.mockClear();
});

describe('auditQuerySchema', () => {
  it('aceita query vazia (defaults aplicados)', () => {
    const r = auditQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.limit).toBe(100);
      expect(r.data.offset).toBe(0);
    }
  });

  it('aceita ISO datetime para from/to', () => {
    const r = auditQuerySchema.safeParse({
      from: '2026-01-01T00:00:00Z',
      to: '2026-12-31T23:59:59Z',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita from não-ISO', () => {
    const r = auditQuerySchema.safeParse({ from: '2026-01-01' });
    expect(r.success).toBe(false);
  });

  it('coerce limit string → number', () => {
    const r = auditQuerySchema.safeParse({ limit: '250' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.limit).toBe(250);
  });

  it('rejeita limit > 1000', () => {
    expect(auditQuerySchema.safeParse({ limit: 1500 }).success).toBe(false);
  });

  it('rejeita limit < 1', () => {
    expect(auditQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it('valida email format', () => {
    expect(auditQuerySchema.safeParse({ user_email: 'not-email' }).success).toBe(false);
    expect(auditQuerySchema.safeParse({ user_email: 'a@b.com' }).success).toBe(true);
  });

  it('valida UUID format', () => {
    expect(auditQuerySchema.safeParse({ user_id: 'abc' }).success).toBe(false);
    expect(
      auditQuerySchema.safeParse({ user_id: '11111111-2222-3333-4444-555555555555' }).success,
    ).toBe(true);
  });
});

describe('toCsv', () => {
  const sampleRow: AdminActivityLog = {
    id: 'abc-123',
    created_at: '2026-05-17T10:00:00.000Z',
    user_id: 'user-uuid',
    user_email: 'admin@msm.com.br',
    action: 'update',
    table_name: 'products',
    record_id: 'prod-uuid',
    record_label: 'Molho Especial',
    changes: { name: 'novo' },
    ip_address: '10.0.0.1',
    user_agent: 'Mozilla/5.0',
  };

  it('emite header line + uma linha por row', () => {
    const csv = toCsv([sampleRow]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'id,created_at,user_id,user_email,action,table_name,record_id,record_label,ip_address,user_agent,changes',
    );
    expect(lines[1]).toContain('abc-123');
    expect(lines[1]).toContain('Molho Especial');
  });

  it('escapa quotes corretamente (RFC 4180)', () => {
    const row: AdminActivityLog = {
      ...sampleRow,
      record_label: 'Produto "Premium" Especial',
    };
    const csv = toCsv([row]);
    expect(csv).toContain('"Produto ""Premium"" Especial"');
  });

  it('quota fields com vírgula', () => {
    const row: AdminActivityLog = {
      ...sampleRow,
      record_label: 'A, B, C',
    };
    const csv = toCsv([row]);
    expect(csv).toContain('"A, B, C"');
  });

  it('quota fields com newline', () => {
    const row: AdminActivityLog = {
      ...sampleRow,
      record_label: 'linha1\nlinha2',
    };
    const csv = toCsv([row]);
    // Newline dentro de quotes é válido em RFC 4180
    expect(csv).toContain('"linha1\nlinha2"');
  });

  it('null vira string vazia', () => {
    const row: AdminActivityLog = {
      ...sampleRow,
      user_id: null,
      user_email: null,
      changes: null,
    };
    const csv = toCsv([row]);
    const lines = csv.split('\n');
    // user_id é o 3º campo (idx 2)
    const fields = lines[1]!.split(',');
    expect(fields[2]).toBe(''); // user_id
    expect(fields[3]).toBe(''); // user_email
  });

  it('serializa JSON em "changes"', () => {
    const row: AdminActivityLog = {
      ...sampleRow,
      changes: { foo: 'bar', n: 42 },
    };
    const csv = toCsv([row]);
    expect(csv).toContain('{""foo"":""bar"",""n"":42}');
  });

  it('array vazio → só header + newline final', () => {
    const csv = toCsv([]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'id,created_at,user_id,user_email,action,table_name,record_id,record_label,ip_address,user_agent,changes',
    );
    expect(lines.length).toBe(2); // header + empty (do trailing \n)
  });
});

describe('queryAuditTrail', () => {
  it('retorna rows + count + has_more=true quando offset+rows < total', async () => {
    Reflect.set(
      globalThis,
      '__nextChain',
      chainBuilder({
        data: [{ id: 'a' }, { id: 'b' }],
        count: 100,
        error: null,
      }),
    );
    const r = await queryAuditTrail({ limit: 2, offset: 0 });
    expect(r.rows).toHaveLength(2);
    expect(r.count).toBe(100);
    expect(r.has_more).toBe(true);
  });

  it('has_more=false quando offset+rows >= total', async () => {
    Reflect.set(
      globalThis,
      '__nextChain',
      chainBuilder({ data: [{ id: 'a' }], count: 1, error: null }),
    );
    const r = await queryAuditTrail({ limit: 100, offset: 0 });
    expect(r.has_more).toBe(false);
  });

  it('aplica todos os filtros via eq quando fornecidos', async () => {
    Reflect.set(
      globalThis,
      '__nextChain',
      chainBuilder({ data: [], count: 0, error: null }),
    );
    await queryAuditTrail({
      user_email: 'a@b.com',
      user_id: '11111111-2222-3333-4444-555555555555',
      action: 'update',
      table_name: 'products',
      record_id: '22222222-3333-4444-5555-666666666666',
      limit: 100,
      offset: 0,
    });
    const eqArgs = (builderCalls.eq ?? []).map((a) => a[0]);
    expect(eqArgs).toContain('user_email');
    expect(eqArgs).toContain('user_id');
    expect(eqArgs).toContain('action');
    expect(eqArgs).toContain('table_name');
    expect(eqArgs).toContain('record_id');
  });

  it('aplica from/to via gte/lte', async () => {
    Reflect.set(
      globalThis,
      '__nextChain',
      chainBuilder({ data: [], count: 0, error: null }),
    );
    await queryAuditTrail({
      from: '2026-01-01T00:00:00Z',
      to: '2026-12-31T23:59:59Z',
      limit: 100,
      offset: 0,
    });
    expect((builderCalls.gte ?? [])[0]?.[0]).toBe('created_at');
    expect((builderCalls.lte ?? [])[0]?.[0]).toBe('created_at');
  });

  it('erro retorna empty result, não throw', async () => {
    Reflect.set(
      globalThis,
      '__nextChain',
      chainBuilder({ data: null, count: null, error: { message: 'db down' } }),
    );
    const r = await queryAuditTrail({ limit: 100, offset: 0 });
    expect(r.rows).toEqual([]);
    expect(r.count).toBe(0);
    expect(r.has_more).toBe(false);
  });
});
