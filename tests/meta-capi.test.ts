import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { capiConfigurado, enviarEventoMeta, montarFbc } from '@/lib/meta/capi';

// =============================================================================
// CAPI DA META — o que estes testes protegem não é o envio, é o que sai de casa.
//
// Duas classes de erro moram aqui, e nenhuma das duas aparece na tela:
//   1. dado pessoal em claro no corpo da requisição (LGPD, e irreversível — o
//      que saiu, saiu);
//   2. `event_id` faltando ou diferente do que o navegador emitiu, que faz a
//      MESMA conversão ser contada duas vezes e infla o relatório sem avisar.
// =============================================================================

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

const ORIGINAL = { ...process.env };
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.unstubAllGlobals();
});

function ligarCredenciais() {
  process.env.META_PIXEL_ID = '111222333';
  process.env.META_CAPI_TOKEN = 'token-de-teste';
}

/** O corpo que de fato foi pra rede, já desserializado. */
function corpoEnviado() {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return JSON.parse(String(init.body)).data[0];
}

const usuarioBase = {
  email: '  Leo.Beltran@Exemplo.com.BR ',
  telefone: '(11) 99999-0000',
  ip: '200.1.2.3',
  userAgent: 'Mozilla/5.0',
};

describe('sem credencial, o CAPI é inerte', () => {
  it('não chama a rede e não quebra', async () => {
    delete process.env.META_PIXEL_ID;
    delete process.env.META_CAPI_TOKEN;
    expect(capiConfigurado()).toBe(false);
    const r = await enviarEventoMeta({ nome: 'Lead', eventId: 'e1', usuario: {} });
    expect(r).toEqual({ enviado: false, motivo: 'sem-config' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uma variável só não liga nada — meia configuração é pior que nenhuma', async () => {
    process.env.META_PIXEL_ID = '111';
    delete process.env.META_CAPI_TOKEN;
    expect(capiConfigurado()).toBe(false);
    expect(await enviarEventoMeta({ nome: 'Lead', eventId: 'e1', usuario: {} })).toEqual({
      enviado: false,
      motivo: 'sem-config',
    });
  });
});

describe('🔒 nada de dado pessoal em claro', () => {
  beforeEach(ligarCredenciais);

  it('e-mail e telefone saem em SHA-256, nunca legíveis', async () => {
    await enviarEventoMeta({ nome: 'Lead', eventId: 'e1', usuario: usuarioBase });
    const corpo = JSON.stringify(corpoEnviado());
    expect(corpo).not.toContain('Leo.Beltran');
    expect(corpo).not.toContain('99999-0000');
    expect(corpo).not.toContain('11999990000');
  });

  it('o e-mail é normalizado antes do hash (minúsculo, sem espaço)', async () => {
    await enviarEventoMeta({ nome: 'Lead', eventId: 'e1', usuario: usuarioBase });
    expect(corpoEnviado().user_data.em).toBe(sha('leo.beltran@exemplo.com.br'));
  });

  it('o telefone ganha o DDI 55 — sem ele a Meta lê como outro país e o match morre', async () => {
    await enviarEventoMeta({ nome: 'Lead', eventId: 'e1', usuario: usuarioBase });
    expect(corpoEnviado().user_data.ph).toBe(sha('5511999990000'));
  });

  it('não inventa hash de campo vazio', async () => {
    await enviarEventoMeta({
      nome: 'Lead',
      eventId: 'e1',
      usuario: { email: '', telefone: null },
    });
    const ud = corpoEnviado().user_data;
    expect(ud.em).toBeUndefined();
    expect(ud.ph).toBeUndefined();
  });
});

describe('event_id — o que impede contagem em dobro', () => {
  beforeEach(ligarCredenciais);

  it('vai exatamente o id que o navegador emitiu', async () => {
    await enviarEventoMeta({ nome: 'Lead', eventId: 'id-do-browser', usuario: {} });
    expect(corpoEnviado().event_id).toBe('id-do-browser');
  });
});

describe('fbc — liga a conversão ao clique no anúncio', () => {
  it('monta no formato da Meta: fb.1.<timestamp>.<fbclid>', () => {
    const fbc = montarFbc('ABC123', '2026-09-09T00:00:00.000Z');
    expect(fbc).toBe(`fb.1.${Date.parse('2026-09-09T00:00:00.000Z')}.ABC123`);
  });

  it('sem fbclid não inventa nada', () => {
    expect(montarFbc(null)).toBeNull();
    expect(montarFbc('')).toBeNull();
  });

  it('data inválida não vira NaN no meio do valor', () => {
    expect(montarFbc('ABC', 'data-quebrada')).toMatch(/^fb\.1\.\d+\.ABC$/);
  });
});

describe('analytics nunca derruba lead nem pedido', () => {
  beforeEach(ligarCredenciais);

  it('rede fora não lança', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sem rede'));
    await expect(
      enviarEventoMeta({ nome: 'Lead', eventId: 'e1', usuario: {} }),
    ).resolves.toEqual({ enviado: false, motivo: 'erro', detalhe: 'rede' });
  });

  it('resposta de erro da Meta não lança', async () => {
    fetchMock.mockResolvedValueOnce(new Response('token vencido', { status: 401 }));
    await expect(
      enviarEventoMeta({ nome: 'Lead', eventId: 'e1', usuario: {} }),
    ).resolves.toEqual({ enviado: false, motivo: 'erro', detalhe: 'http_401' });
  });
});

describe('⛔ pedido não é compra enquanto o gateway não confirma', () => {
  it('a rota do pedido emite `pedido_registrado`, nunca `Purchase`', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const rota = readFileSync(resolve(process.cwd(), 'src/app/api/pedidos/route.ts'), 'utf-8');
    expect(rota).toMatch(/nome: 'pedido_registrado'/);
    expect(rota).not.toMatch(/nome: 'Purchase'/);
  });
});
