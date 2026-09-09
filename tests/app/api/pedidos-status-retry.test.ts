import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// =============================================================================
// O CÓDIGO DE ERRO É UM CONTRATO, E ESTE AQUI JÁ CUSTOU UMA ATUALIZAÇÃO.
//
// Achado pelo Sentry no primeiro dia (SOMATEC-WEB-3, 09/09): o Supabase
// respondeu "Gateway Timeout" numa atualização de status vinda do ERP. Soluço
// de infraestrutura — sumiria sozinho numa segunda tentativa.
//
// Só que a rota devolvia 400, e 400 significa "sua requisição está errada, não
// repita". Chamador correto obedece. O status ficou velho no site para sempre,
// a página que o cliente acompanha congelou, e ninguém viu erro nenhum: do lado
// do ERP a chamada "respondeu".
//
// Estes testes travam os dois lados da linha:
//   • falha que PASSA  → 503 + Retry-After (repetir resolve)
//   • falha que FICA   → 400 (repetir só gasta chamada)
//
// ⚠️ O risco de errar é assimétrico, e o código segue essa assimetria: chamar
// de transitório algo permanente custa uma tentativa a mais; o contrário custa
// um pedido parado. Na dúvida, transitório.
// =============================================================================

const atualizar = vi.fn();

vi.mock('@/lib/pedidos/servidor', () => ({
  atualizarStatus: (...a: unknown[]) => atualizar(...a),
}));

const { POST } = await import('@/app/api/pedidos/status/route');

const SEGREDO = 'segredo-de-teste';
const ORIGINAL = { ...process.env };

const chamar = () =>
  POST(
    new NextRequest('http://localhost:3000/api/pedidos/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-pedidos-secret': SEGREDO },
      body: JSON.stringify({ numero: 'SB0001', status: 'enviado' }),
    }),
  );

beforeEach(() => {
  process.env.PEDIDOS_STATUS_SECRET = SEGREDO;
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.clearAllMocks();
});

describe('falha que passa → 503, e o chamador pode repetir', () => {
  it('Gateway Timeout do banco não vira 400', async () => {
    atualizar.mockResolvedValue({ ok: false, erro: 'Gateway Timeout', transitorio: true });

    const res = await chamar();

    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('30');
    await expect(res.json()).resolves.toMatchObject({ ok: false, transitorio: true });
  });
});

describe('falha que fica → 400, repetir não resolve', () => {
  it('pedido inexistente continua 400 e sem Retry-After', async () => {
    atualizar.mockResolvedValue({ ok: false, erro: 'pedido nao encontrado' });

    const res = await chamar();

    expect(res.status).toBe(400);
    expect(res.headers.get('retry-after')).toBeNull();
    await expect(res.json()).resolves.toMatchObject({ ok: false, transitorio: false });
  });
});

describe('o caminho feliz não mudou', () => {
  it('sucesso segue 200 com número e status', async () => {
    atualizar.mockResolvedValue({ ok: true, numero: 'SB0001', status: 'enviado' });

    const res = await chamar();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      numero: 'SB0001',
      status: 'enviado',
    });
  });
});
