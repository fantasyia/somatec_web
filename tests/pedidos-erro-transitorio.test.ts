import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// QUEM DECIDE se a falha passa ou fica é esta função — a rota só traduz em
// código HTTP. Se a classificação errar aqui, o 503 da rota não salva nada.
//
// Os casos abaixo são os que o Postgres e a rede realmente devolvem quando o
// problema é passageiro. O contra-exemplo importa tanto quanto: "pedido não
// encontrado" NÃO pode virar transitório, senão o ERP fica repetindo para
// sempre uma chamada que nunca vai dar certo.
// =============================================================================

const rpc = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({ rpc: (...a: unknown[]) => rpc(...a) }),
}));

const { atualizarStatus } = await import('@/lib/pedidos/servidor');

const ORIGINAL = { ...process.env };

const mover = () =>
  atualizarStatus({ numero: 'SB0001', status: 'enviado' as const });

beforeEach(() => {
  process.env.PEDIDOS_STATUS_SECRET = 'segredo-de-teste';
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.clearAllMocks();
});

describe('marca como transitório o que resolve tentando de novo', () => {
  it.each([
    ['Gateway Timeout (o erro real de 09/09)', { message: 'Gateway Timeout' }],
    ['statement timeout do Postgres', { code: '57014', message: 'canceling statement' }],
    ['banco sem conexão sobrando', { code: '53300', message: 'too many connections' }],
    ['conexão derrubada no meio', { code: '08006', message: 'connection failure' }],
    ['resposta 5xx do PostgREST', { status: 502, message: 'bad gateway' }],
    ['rede não completou', { message: 'fetch failed' }],
  ])('%s', async (_, erro) => {
    rpc.mockResolvedValue({ data: null, error: erro });

    const r = await mover();

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.transitorio).toBe(true);
  });

  it('exceção de rede também é transitória — o fetch nem completou', async () => {
    rpc.mockRejectedValue(new Error('ECONNRESET'));

    const r = await mover();

    expect(r.ok === false && r.transitorio).toBe(true);
  });
});

describe('NÃO marca o que repetir não resolve', () => {
  it('pedido inexistente é definitivo', async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    const r = await mover();

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.transitorio).toBeFalsy();
  });

  it('segredo recusado pela função do banco é definitivo', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'segredo invalido' } });

    const r = await mover();

    expect(r.ok === false && r.transitorio).toBe(false);
  });

  it('sem PEDIDOS_STATUS_SECRET nem chega no banco', async () => {
    delete process.env.PEDIDOS_STATUS_SECRET;

    const r = await mover();

    expect(r.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
