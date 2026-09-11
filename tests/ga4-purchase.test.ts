import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// O `purchase` QUE FAZ A VENDA EXISTIR NO RELATÓRIO.
//
// Medido na auditoria do Google em 11/09: o `pedido_registrado` do navegador
// leva `items`, `currency` e `value`, e o valor CHEGA — `eventValue` acumulou
// R$ 17.800 em 30 dias. Mesmo assim o GA4 mostra `purchaseRevenue = 0` e o
// público "Purchasers" está vazio, porque só evento de NOME PADRÃO alimenta
// relatório de e-commerce. `pedido_registrado` é custom.
//
// O que este arquivo protege são os quatro jeitos de isso dar errado calado —
// e o Measurement Protocol é calado por construção: responde 204 pra evento
// aceito E pra evento recusado.
//
//   1. disparar no PEDIDO   → a receita passa a contar quem não pagou
//   2. contar a PARCELA     → R$ 725 no lugar de uma venda de R$ 4.350
//   3. contar duas vezes    → reentrega do Asaas virando duas vendas
//   4. inventar a venda     → webhook de outro sistema virando receita nossa
// =============================================================================

const redisStore = new Map<string, string>();
const fetchMock = vi.fn();
const consulta = vi.fn();

vi.mock('@/lib/redis', () => ({
  getRedis: () => ({
    set: async (k: string, v: string) => {
      const tinha = redisStore.has(k);
      redisStore.set(k, v);
      return tinha ? null : 'OK';
    },
    get: async (k: string) => redisStore.get(k) ?? null,
  }),
}));

vi.mock('@/lib/email/enviar', () => ({ enviarEmail: async () => undefined }));

vi.mock('@/lib/pedidos/servidor', () => ({
  contatoDoPedido: async () => undefined, // sem e-mail: não é o assunto daqui
  consultarPedido: (...a: unknown[]) => consulta(...a),
}));

const logs: Array<{ nivel: string; msg: string }> = [];
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: () => {},
    info: (msg: string) => logs.push({ nivel: 'info', msg }),
    warn: (msg: string) => logs.push({ nivel: 'warn', msg }),
    error: (msg: string) => logs.push({ nivel: 'error', msg }),
    child: () => ({ debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }),
  }),
}));

const { registrarEventoPagamento } = await import('@/lib/pagamento/registro');
const {
  clientIdDoCookieGa,
  sessionIdDoCookieGa,
  cookieDeSessaoGa4,
  clientIdSintetico,
  guardarIdentidadeGa4,
} = await import('@/lib/analytics/ga4-servidor');

const ORIGINAL = { ...process.env };
const NUMERO = 'SB2608K7M2QX';

const pedido = (extra: Record<string, unknown> = {}) => ({
  numero: NUMERO,
  status: 'recebido',
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  itens: [{ descricao: 'Quadro principal', modelo: 'MB-04', quantidade: 1, precoCentavos: 435_000 }],
  totalCentavos: 435_000,
  freteCentavos: 0,
  formaPagamento: 'PIX',
  transportadora: null,
  rastreioCodigo: null,
  rastreioUrl: null,
  historico: [],
  primeiroNome: 'Marina',
  cidade: 'São Paulo',
  uf: 'SP',
  ...extra,
});

const evento = (extra: Record<string, unknown> = {}) => ({
  eventoId: `evt_${Math.random()}`,
  evento: 'PAYMENT_RECEIVED',
  numeroPedido: NUMERO,
  cobrancaId: 'pay_1',
  situacao: 'pago' as const,
  valorCentavos: 435_000,
  ...extra,
});

/** O corpo que foi mandado pro GA4, já em objeto. */
function corpoEnviado(chamada = 0) {
  const [, init] = fetchMock.mock.calls[chamada] as [string, { body: string }];
  return JSON.parse(init.body) as {
    client_id: string;
    events: Array<{ name: string; params: Record<string, unknown> }>;
  };
}

const urlEnviada = (chamada = 0) => String((fetchMock.mock.calls[chamada] as [string])[0]);

beforeEach(() => {
  redisStore.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 204, text: async () => '' });
  consulta.mockReset().mockResolvedValue(pedido());
  logs.length = 0;
  vi.stubGlobal('fetch', fetchMock);
  process.env.GA4_MEASUREMENT_ID = 'G-TESTE12345';
  process.env.GA4_API_SECRET = 'segredo-de-teste';
  delete process.env.GA4_MP_DEBUG;
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.unstubAllGlobals();
});

describe('inerte sem credencial', () => {
  it('sem as duas variáveis, nada sai — e o pagamento é registrado igual', async () => {
    delete process.env.GA4_API_SECRET;
    const r = await registrarEventoPagamento(evento());
    expect(r).toBe('registrado');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('só o measurement_id não basta — segredo faltando é o caso comum', async () => {
    process.env.GA4_API_SECRET = '';
    await registrarEventoPagamento(evento());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('o evento que chega no GA4', () => {
  it('chama o Measurement Protocol com o nome PADRÃO da especificação', async () => {
    await registrarEventoPagamento(evento());
    expect(urlEnviada()).toContain('https://www.google-analytics.com/mp/collect');
    expect(urlEnviada()).toContain('measurement_id=G-TESTE12345');
    // `pedido_registrado` é custom e não alimenta relatório de receita. O nome
    // aqui tem que ser exatamente `purchase`.
    expect(corpoEnviado().events[0].name).toBe('purchase');
  });

  it('leva transaction_id, value, currency e items', async () => {
    await registrarEventoPagamento(evento());
    const p = corpoEnviado().events[0].params;
    // O `transaction_id` é o MESMO que o navegador mandou no
    // `pedido_registrado`: é por ele que o GA4 deduplica compra.
    expect(p.transaction_id).toBe(NUMERO);
    expect(p.value).toBe(4350);
    expect(p.currency).toBe('BRL');
    expect(p.items).toEqual([
      { item_id: 'MB-04', item_name: 'Master Block MB-04', quantity: 1, price: 4350 },
    ]);
  });

  it('o item sai no mesmo formato do navegador — senão o relatório racha em dois', async () => {
    // O checkout manda `item_id: modelo.model` e `item_name: "Master Block …"`.
    // Mandando a descrição do quadro daqui, o GA4 mostraria o mesmo produto
    // como dois itens e sumiria a visão de QUAL modelo vende.
    await registrarEventoPagamento(evento());
    const items = corpoEnviado().events[0].params.items as Array<Record<string, unknown>>;
    expect(items[0].item_id).toBe('MB-04');
    expect(items[0].item_name).toBe('Master Block MB-04');
  });

  it('sem modelo, cai na descrição em vez de mandar item sem id', async () => {
    consulta.mockResolvedValue(
      pedido({
        itens: [{ descricao: 'Quadro da oficina', modelo: null, quantidade: 2, precoCentavos: 100_000 }],
      }),
    );
    await registrarEventoPagamento(evento());
    const items = corpoEnviado().events[0].params.items as Array<Record<string, unknown>>;
    expect(items[0]).toEqual({
      item_id: 'Quadro da oficina',
      item_name: 'Quadro da oficina',
      quantity: 2,
      price: 1000,
    });
  });
});

describe('🔴 parcelado — o Asaas manda um evento POR PARCELA', () => {
  it('conta o TOTAL da venda, não o valor da parcela', async () => {
    await registrarEventoPagamento(
      evento({
        valorCentavos: 72_500, // a parcela
        parcelamento: { id: 'inst_1', totalCentavos: 435_000, parcelas: 6 },
      }),
    );
    // R$ 725 no relatório de uma venda de R$ 4.350 é receita errada por um
    // fator de seis — e ninguém confere isso olhando o painel.
    expect(corpoEnviado().events[0].params.value).toBe(4350);
  });

  it('e avisa UMA vez só — as outras cinco parcelas saem por "repetido"', async () => {
    const parc = { id: 'inst_1', totalCentavos: 435_000, parcelas: 6 };
    for (let i = 0; i < 6; i++) {
      await registrarEventoPagamento(evento({ eventoId: `evt_${i}`, valorCentavos: 72_500, parcelamento: parc }));
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('🔴 reentrega não vira segunda venda', () => {
  it('o mesmo evento duas vezes manda o purchase uma vez', async () => {
    const e = evento({ eventoId: 'evt_fixo' });
    expect(await registrarEventoPagamento(e)).toBe('registrado');
    expect(await registrarEventoPagamento(e)).toBe('repetido');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('⛔ o que NÃO pode virar purchase', () => {
  it('pagamento não concluído não conta venda', async () => {
    await registrarEventoPagamento(evento({ situacao: 'nao_pago', evento: 'PAYMENT_REFUNDED' }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('webhook de pedido que não existe aqui não inventa receita', async () => {
    // Cobrança criada fora do checkout, integração de terceiro ou disparo de
    // teste: sem itens e sem total, mandar `purchase` seria criar uma venda no
    // relatório a partir de nada.
    consulta.mockResolvedValue(undefined);
    await registrarEventoPagamento(evento());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('quem navegou — a ligação com a pessoa', () => {
  it('usa o client_id guardado no pedido', async () => {
    await guardarIdentidadeGa4(NUMERO, { clientId: '123456789.1700000000', sessionId: '1789103637' });
    await registrarEventoPagamento(evento());
    const corpo = corpoEnviado();
    expect(corpo.client_id).toBe('123456789.1700000000');
    expect(corpo.events[0].params.session_id).toBe('1789103637');
    expect(corpo.events[0].params.cid_origem).toBe('ga');
  });

  it('sem client_id guardado, MANDA mesmo assim — e marca que não tem gente atrás', async () => {
    // A escolha é entre "a venda não aparece na receita" e "aparece sem
    // usuário". Dinheiro que entrou tem que aparecer; o `cid_origem` é o que
    // permite separar os dois no relatório depois.
    await registrarEventoPagamento(evento());
    const corpo = corpoEnviado();
    expect(corpo.client_id).toBe(clientIdSintetico(NUMERO));
    expect(corpo.events[0].params.cid_origem).toBe('pedido');
    expect(corpo.events[0].params.session_id).toBeUndefined();
  });

  it('o id sintético é determinístico — reentrega não inventa usuário novo', () => {
    expect(clientIdSintetico(NUMERO)).toBe(clientIdSintetico(NUMERO));
    expect(clientIdSintetico(NUMERO)).not.toBe(clientIdSintetico('SB2608K7M2QY'));
    expect(clientIdSintetico(NUMERO)).toMatch(/^\d+\.\d+$/);
  });
});

describe('os cookies do GA4 — é de onde sai o client_id', () => {
  it('tira o client_id do `_ga`', () => {
    expect(clientIdDoCookieGa('GA1.1.123456789.1700000000')).toBe('123456789.1700000000');
  });

  it('aguenta um nível a mais de domínio', () => {
    expect(clientIdDoCookieGa('GA1.2.3.987654321.1700000000')).toBe('987654321.1700000000');
  });

  it('devolve null pro que não é cookie do GA — melhor sem id que com id errado', () => {
    expect(clientIdDoCookieGa(undefined)).toBeNull();
    expect(clientIdDoCookieGa('')).toBeNull();
    expect(clientIdDoCookieGa('GA1.1')).toBeNull();
    expect(clientIdDoCookieGa('GA1.1.abc.def')).toBeNull();
  });

  it('lê session_id nos DOIS formatos que existem em campo', () => {
    // GS1 e GS2 convivem e a diferença não é documentada — errar o formato faz
    // o `purchase` cair numa sessão nova, separado da navegação da pessoa.
    expect(sessionIdDoCookieGa('GS1.1.1789103637.1.0.1789103637.0.0.0')).toBe('1789103637');
    expect(sessionIdDoCookieGa('GS2.1.s1789103637$o1$g0$t1789103637$j0$l0$h0')).toBe('1789103637');
    expect(sessionIdDoCookieGa('lixo')).toBeNull();
  });

  it('sabe o nome do cookie de sessão a partir do measurement id', () => {
    expect(cookieDeSessaoGa4('G-J12FLMK7S6')).toBe('_ga_J12FLMK7S6');
  });
});

describe('nada disso pode derrubar o webhook', () => {
  it('GA4 fora do ar não muda o resultado do registro', async () => {
    fetchMock.mockRejectedValue(new Error('rede fora'));
    expect(await registrarEventoPagamento(evento())).toBe('registrado');
    // `warn`, não `error`: o dinheiro entrou, o cliente foi avisado e o ERP
    // recebeu. O que se perde é uma linha de relatório — alarme de erro aqui
    // treinaria a ignorar alarme de verdade.
    expect(logs.some((l) => l.nivel === 'error')).toBe(false);
  });

  it('GA4 recusando (4xx) também não derruba', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'ruim' });
    expect(await registrarEventoPagamento(evento())).toBe('registrado');
  });
});

describe('o modo de validação — porque o MP falha calado', () => {
  it('com GA4_MP_DEBUG=true vai pro endpoint que explica a recusa', async () => {
    process.env.GA4_MP_DEBUG = 'true';
    await registrarEventoPagamento(evento());
    // O endpoint normal responde 204 pra evento bom e pra evento recusado. Sem
    // este modo, um parâmetro fora do formato seria indistinguível de sucesso.
    expect(urlEnviada()).toContain('/debug/mp/collect');
  });

  it('sem a variável, vai pro endpoint normal (o debug NÃO grava o evento)', async () => {
    await registrarEventoPagamento(evento());
    expect(urlEnviada()).toContain('/mp/collect');
    expect(urlEnviada()).not.toContain('/debug/');
  });
});
