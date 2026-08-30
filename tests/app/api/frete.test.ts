import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { ResultadoCotacao } from '@/lib/erp/frete';

// =============================================================================
// O STATUS HTTP de /api/frete é lido por monitoramento, não por gente.
//
// A regra da rota: `indisponivel` é 502 porque o ERP falhou de verdade;
// problema de CONFIGURAÇÃO é 200, porque o servidor está bem e o checkout
// segue em frente com "prazo confirmado no pedido".
//
// Isso importa na prática: com os MB-01..MB-12 ainda não vinculados à
// integração 53309, TODA cotação falha. Se essa falha respondesse 502, o
// monitoramento acusaria o site de erro de servidor sem parar, e o alerta de
// "ERP fora do ar" perderia o sentido de tanto tocar à toa.
// =============================================================================

const cotarMock = vi.fn<() => Promise<ResultadoCotacao>>();
vi.mock('@/lib/erp/frete', () => ({ cotarFreteErp: () => cotarMock() }));

const { POST } = await import('@/app/api/frete/route');

function pedido(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/frete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const CARRINHO = { cepDestino: '01310-100', itens: [{ model: 'MB-01', quantidade: 1 }] };

beforeEach(() => cotarMock.mockReset());

describe('status HTTP por motivo de falha', () => {
  it('produto não vinculado é 200 — é cadastro, não queda do ERP', async () => {
    cotarMock.mockResolvedValue({
      ok: false,
      motivo: 'produto_nao_vinculado',
      opcoes: [],
      detalhe: "HTTP 400: {\"error\":\"Item 'MB-01' não encontrado.\"}",
    });
    const res = await POST(pedido(CARRINHO));
    expect(res.status).toBe(200);
    expect((await res.json()).motivo).toBe('produto_nao_vinculado');
  });

  it('ERP fora do ar continua sendo 502', async () => {
    cotarMock.mockResolvedValue({ ok: false, motivo: 'indisponivel', opcoes: [] });
    expect((await POST(pedido(CARRINHO))).status).toBe(502);
  });

  it('credencial ausente ou recusada é 200', async () => {
    for (const motivo of ['sem_credencial', 'credencial_invalida'] as const) {
      cotarMock.mockResolvedValue({ ok: false, motivo, opcoes: [] });
      expect((await POST(pedido(CARRINHO))).status, motivo).toBe(200);
    }
  });

  it('cotação boa é 200 com as opções', async () => {
    cotarMock.mockResolvedValue({
      ok: true,
      opcoes: [{ id: '1', nome: 'Jadlog .Package', transportadora: 'Jadlog', valor: 42.9, prazoDias: 5 }],
    });
    const res = await POST(pedido(CARRINHO));
    expect(res.status).toBe(200);
    expect((await res.json()).opcoes).toHaveLength(1);
  });
});

describe('o detalhe do ERP não vaza pro cliente', () => {
  // O `detalhe` carrega a mensagem crua do ERP. Com CRON_SECRET configurado
  // (como em produção), só sai pra quem manda o Bearer certo. Sem secret
  // configurado, `validateBearer` libera de propósito — é o modo de
  // desenvolvimento, e por isso o teste configura o segredo.
  const FALHA: ResultadoCotacao = {
    ok: false,
    motivo: 'produto_nao_vinculado',
    opcoes: [],
    detalhe: "HTTP 400: {\"error\":\"Item 'MB-01' não encontrado.\"}",
  };

  beforeEach(() => vi.stubEnv('CRON_SECRET', 'segredo-do-cron'));
  afterEach(() => vi.unstubAllEnvs());

  it('sem o Bearer, a resposta NÃO carrega o detalhe', async () => {
    cotarMock.mockResolvedValue(FALHA);
    const corpo = await (await POST(pedido(CARRINHO))).json();
    expect(corpo.detalhe).toBeUndefined();
    // nem sobra pista da mensagem interna em outro campo
    expect(JSON.stringify(corpo)).not.toMatch(/não encontrado|olist/i);
    // mas o motivo continua vindo — é ele que o checkout usa pra degradar
    expect(corpo.motivo).toBe('produto_nao_vinculado');
  });

  it('com Bearer errado também não vaza', async () => {
    cotarMock.mockResolvedValue(FALHA);
    const res = await POST(pedido(CARRINHO, { authorization: 'Bearer chute' }));
    expect((await res.json()).detalhe).toBeUndefined();
  });

  it('com o Bearer certo, o detalhe vem — é o que diz QUAL sku falhou', async () => {
    cotarMock.mockResolvedValue(FALHA);
    const res = await POST(pedido(CARRINHO, { authorization: 'Bearer segredo-do-cron' }));
    expect((await res.json()).detalhe).toContain('MB-01');
  });
});

describe('carrinho que não dá pra cotar', () => {
  it('CEP incompleto é 400 e não chama o ERP', async () => {
    const res = await POST(pedido({ cepDestino: '013', itens: [{ model: 'MB-01', quantidade: 1 }] }));
    expect(res.status).toBe(400);
    expect(cotarMock).not.toHaveBeenCalled();
  });

  it('carrinho vazio é 400 e não chama o ERP', async () => {
    const res = await POST(pedido({ cepDestino: '01310100', itens: [] }));
    expect(res.status).toBe(400);
    expect(cotarMock).not.toHaveBeenCalled();
  });
});
