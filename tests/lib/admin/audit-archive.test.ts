import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mocks de Supabase ---
const selectMock = vi.fn();
const deleteMock = vi.fn();
const inMock = vi.fn();
const orderMock = vi.fn();
const limitMock = vi.fn();
const headMock = vi.fn();
const ltMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      select: (...args: unknown[]) => selectMock(...args),
      delete: () => deleteMock(),
    }),
  }),
}));

const { archiveExpired, countExpired, countTotal } = await import('@/lib/admin/audit-archive');
const { __resetForTests, renderPrometheus } = await import('@/lib/metrics/registry');

beforeEach(() => {
  __resetForTests();
  selectMock.mockReset();
  deleteMock.mockReset();
  inMock.mockReset();
  orderMock.mockReset();
  limitMock.mockReset();
  headMock.mockReset();
  ltMock.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

// Helper: encadeia builder chain `select(...).lt(...).order(...).limit(...)`
function chainSelectForDelete(idsToReturn: { id: string }[]) {
  selectMock.mockImplementationOnce(() => ({
    lt: () => ({
      order: () => ({
        limit: () => Promise.resolve({ data: idsToReturn, error: null }),
      }),
    }),
  }));
}
function chainCountTotal(count: number | null) {
  selectMock.mockImplementationOnce(() => Promise.resolve({ count, error: null }));
}
function chainCountExpired(count: number | null) {
  selectMock.mockImplementationOnce(() => ({
    lt: () => Promise.resolve({ count, error: null }),
  }));
}
function chainDeleteIn() {
  deleteMock.mockImplementationOnce(() => ({
    in: () => Promise.resolve({ error: null }),
  }));
}

describe('countExpired', () => {
  it('retorna count > 0 quando há expirados', async () => {
    chainCountExpired(42);
    expect(await countExpired()).toBe(42);
  });

  it('retorna 0 quando não há expirados', async () => {
    chainCountExpired(0);
    expect(await countExpired()).toBe(0);
  });

  it('aceita retentionDays customizado', async () => {
    chainCountExpired(5);
    expect(await countExpired(7)).toBe(5);
  });

  it('retorna null em erro', async () => {
    selectMock.mockImplementationOnce(() => ({
      lt: () => Promise.resolve({ count: null, error: { message: 'db down' } }),
    }));
    expect(await countExpired()).toBeNull();
  });
});

describe('countTotal', () => {
  it('retorna o count total', async () => {
    chainCountTotal(150);
    expect(await countTotal()).toBe(150);
  });

  it('retorna null em erro', async () => {
    selectMock.mockImplementationOnce(() => Promise.resolve({ count: null, error: { message: 'x' } }));
    expect(await countTotal()).toBeNull();
  });
});

describe('archiveExpired', () => {
  it('apaga N registros e retorna estatísticas + atualiza métricas', async () => {
    chainSelectForDelete([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    chainDeleteIn();
    chainCountTotal(97);

    const result = await archiveExpired(90);
    expect(result.deleted_count).toBe(3);
    expect(result.remaining_count).toBe(97);
    expect(result.retention_days).toBe(90);
    expect(result.cutoff_date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);

    const metrics = renderPrometheus({});
    expect(metrics).toContain('msm_audit_archive_deleted_total 3');
    expect(metrics).toContain('msm_audit_log_rows 97');
  });

  it('quando não há expirados: deleted=0, sem chamar delete', async () => {
    chainSelectForDelete([]);
    chainCountTotal(50);

    const result = await archiveExpired();
    expect(result.deleted_count).toBe(0);
    expect(result.remaining_count).toBe(50);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('falha no select não crasha — retorna deleted=0', async () => {
    selectMock.mockImplementationOnce(() => ({
      lt: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: null, error: { message: 'db down' } }),
        }),
      }),
    }));
    chainCountTotal(50);

    const result = await archiveExpired();
    expect(result.deleted_count).toBe(0);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('falha no delete não crasha — deleted=0', async () => {
    chainSelectForDelete([{ id: 'a' }]);
    deleteMock.mockImplementationOnce(() => ({
      in: () => Promise.resolve({ error: { message: 'permission denied' } }),
    }));
    chainCountTotal(50);

    const result = await archiveExpired();
    expect(result.deleted_count).toBe(0);
  });

  it('usa AUDIT_RETENTION_DAYS default 90', async () => {
    chainSelectForDelete([]);
    chainCountTotal(0);
    const result = await archiveExpired();
    expect(result.retention_days).toBe(90);
  });

  it('respeita retention custom (e.g. 30)', async () => {
    chainSelectForDelete([]);
    chainCountTotal(0);
    const result = await archiveExpired(30);
    expect(result.retention_days).toBe(30);
    // cutoff = now - 30 days
    const cutoff = new Date(result.cutoff_date).getTime();
    const expected = Date.now() - 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff - expected)).toBeLessThan(1000); // dentro de 1s
  });

  it('cutoff_date é ISO string válida', async () => {
    chainSelectForDelete([]);
    chainCountTotal(0);
    const result = await archiveExpired();
    expect(() => new Date(result.cutoff_date)).not.toThrow();
  });
});
