import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// A VISITA DE TESTE NÃO PODE CONTAR COMO CLIENTE.
//
// Medido na auditoria do Google em 11/09: nos 30 dias anteriores, 100% das
// conversões do GA4 — `generate_lead` ×5 e `pedido_registrado` ×5 — vieram de
// `teste_leo / cpc`. Com a importação pro Google Ads ligada, cada teste do Léo
// entraria lá como conversão de verdade; o custo por lead da primeira campanha
// nasceria dividido por dez, e a decisão de quanto investir sairia desse número.
//
// Quem exclui é o filtro "Internal Traffic" do GA4, que procura
// `traffic_type = internal` — EXATO. Este arquivo protege as duas metades que
// somem sem fazer barulho:
//
//   1. o VALOR. "interno", "Internal", `true` — qualquer variação passa pelo
//      filtro e a visita volta a contar. Não existe erro pra ver.
//   2. a PERSISTÊNCIA. Só a página de entrada tem o `utm_source` na URL. Sem
//      guardar a flag, a partir da segunda página o teste vira visitante real —
//      e é na segunda página em diante que o formulário e o checkout ficam.
// =============================================================================

type JanelaFake = {
  location: { search: string };
  localStorage: Storage;
  dataLayer: Record<string, unknown>[];
  __somatecGTM?: boolean;
  gtag?: unknown;
};

function memoriaStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
}

/** Monta a janela como se o visitante tivesse chegado nesta URL. */
function visitar(search: string, storage: Storage = memoriaStorage()): JanelaFake {
  const janela: JanelaFake = {
    location: { search },
    localStorage: storage,
    dataLayer: [],
    __somatecGTM: true,
  };
  (globalThis as { window?: unknown }).window = janela;
  (globalThis as { localStorage?: unknown }).localStorage = storage;
  return janela;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { localStorage?: unknown }).localStorage;
  vi.restoreAllMocks();
});

const mod = () => import('@/lib/analytics/trafego-interno');

describe('o valor — é o que o filtro do GA4 compara', () => {
  it('é exatamente `internal`, em minúsculas', async () => {
    const { VALOR_INTERNO } = await mod();
    expect(VALOR_INTERNO).toBe('internal');
  });

  it('visita interna sai com traffic_type=internal', async () => {
    visitar('?utm_source=teste_leo');
    const { paramsTrafegoInterno } = await mod();
    expect(paramsTrafegoInterno()).toEqual({ traffic_type: 'internal' });
  });

  it('visita real NÃO carrega a chave — nem vazia, nem undefined', async () => {
    visitar('?utm_source=google&utm_medium=cpc');
    const { paramsTrafegoInterno } = await mod();
    // `{ traffic_type: undefined }` chegaria no GA4 como parâmetro presente e
    // vazio: ruído em todo evento de todo visitante, e sem serventia nenhuma.
    expect(paramsTrafegoInterno()).toEqual({});
    expect('traffic_type' in paramsTrafegoInterno()).toBe(false);
  });

  it('outro utm_source não marca — só o de teste', async () => {
    visitar('?utm_source=teste_outro');
    const { trafegoInterno } = await mod();
    expect(trafegoInterno()).toBe(false);
  });
});

describe('a persistência — a marca tem que sobreviver à segunda página', () => {
  it('entrou com o utm, navegou pra uma página sem utm: continua interna', async () => {
    const storage = memoriaStorage();
    visitar('?utm_source=teste_leo', storage);
    const { marcarTrafegoInterno, trafegoInterno } = await mod();
    marcarTrafegoInterno();

    // Página seguinte: nenhum sinal na URL. É aqui que ficam o formulário e o
    // checkout — sem a flag, o lead e o pedido de teste voltam a contar.
    visitar('', storage);
    expect(trafegoInterno()).toBe(true);
  });

  it('storage de outro visitante não herda a marca', async () => {
    const storage = memoriaStorage();
    visitar('?utm_source=teste_leo', storage);
    const { marcarTrafegoInterno } = await mod();
    marcarTrafegoInterno();

    visitar('', memoriaStorage()); // outro navegador
    const { trafegoInterno } = await mod();
    expect(trafegoInterno()).toBe(false);
  });

  it('localStorage bloqueado (janela privada) não derruba nada', async () => {
    const quebrado = {
      getItem: () => {
        throw new Error('storage bloqueado');
      },
      setItem: () => {
        throw new Error('storage bloqueado');
      },
    } as unknown as Storage;
    visitar('?utm_source=teste_leo', quebrado);
    const { marcarTrafegoInterno, trafegoInterno } = await mod();

    expect(() => marcarTrafegoInterno()).not.toThrow();
    // A URL ainda tem o utm, então a página de entrada segue marcada. O que se
    // perde é a navegação seguinte — degradação, não quebra.
    expect(trafegoInterno()).toBe(true);
  });
});

describe('os emissores de evento carregam a marca', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('trackEvent marca evento de visita interna', async () => {
    const janela = visitar('?utm_source=teste_leo');
    const { trackEvent } = await import('@/lib/analytics');
    trackEvent('generate_lead', { form_id: 'contato' });
    expect(janela.dataLayer.at(-1)).toMatchObject({
      event: 'generate_lead',
      form_id: 'contato',
      traffic_type: 'internal',
    });
  });

  it('trackEvent não marca visita real', async () => {
    const janela = visitar('');
    const { trackEvent } = await import('@/lib/analytics');
    trackEvent('generate_lead', { form_id: 'contato' });
    expect(janela.dataLayer.at(-1)).not.toHaveProperty('traffic_type');
  });

  it('o evento de PEDIDO também — é o que carrega dinheiro', async () => {
    const janela = visitar('?utm_source=teste_leo');
    vi.doMock('@/lib/attribution', () => ({ getAtribuicao: () => undefined }));
    const { rastrearPedidoRegistrado } = await import('@/lib/analytics/eventos');
    rastrearPedidoRegistrado({
      transactionId: 'SB-TESTE-1',
      value: 4350,
      items: [{ item_id: 'MB-01', item_name: 'Master Block 01', quantity: 1, price: 4350 }],
    });
    // `emitirEcommerce` é um caminho SEPARADO do `trackEvent`: passa direto pro
    // dataLayer. Marcar só num dos dois deixaria justamente o evento de receita
    // de fora.
    expect(janela.dataLayer.at(-1)).toMatchObject({
      event: 'pedido_registrado',
      traffic_type: 'internal',
    });
  });
});

describe('o snippet do <head> — marca antes de a primeira tag disparar', () => {
  const layout = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf-8');

  it('roda com beforeInteractive', () => {
    expect(layout).toMatch(/id="trafego-interno"[\s\S]{0,80}beforeInteractive/);
  });

  it('vem ANTES do container GTM', () => {
    // Depois do container é tarde: o `page_view` já saiu sem a marca.
    expect(layout.indexOf('id="trafego-interno"')).toBeLessThan(layout.indexOf('id="gtm"'));
  });

  it('usa as MESMAS constantes do módulo — não uma cópia que vai divergir', async () => {
    const { TRAFEGO_INTERNO_SNIPPET, UTM_INTERNO, CHAVE_INTERNO, VALOR_INTERNO } = await mod();
    expect(TRAFEGO_INTERNO_SNIPPET).toContain(`'${UTM_INTERNO}'`);
    expect(TRAFEGO_INTERNO_SNIPPET).toContain(`'${CHAVE_INTERNO}'`);
    expect(TRAFEGO_INTERNO_SNIPPET).toContain(`traffic_type: '${VALOR_INTERNO}'`);
  });

  it('não derruba a página se o storage estourar', async () => {
    const { TRAFEGO_INTERNO_SNIPPET } = await mod();
    expect(TRAFEGO_INTERNO_SNIPPET).toMatch(/try \{[\s\S]*\} catch/);
  });

  it('o snippet roda de verdade: grava a flag e semeia o dataLayer', async () => {
    const janela = visitar('?utm_source=teste_leo');
    const { TRAFEGO_INTERNO_SNIPPET, CHAVE_INTERNO, trafegoInterno } = await mod();
    // Executa o texto que vai pro <head>, com o mesmo window do teste. Testar a
    // string por regex provaria só que ela MENCIONA a chave certa.
    new Function('window', 'localStorage', 'URLSearchParams', TRAFEGO_INTERNO_SNIPPET)(
      janela,
      janela.localStorage,
      URLSearchParams,
    );
    expect(janela.localStorage.getItem(CHAVE_INTERNO)).toBe('1');
    expect(janela.dataLayer).toContainEqual({ traffic_type: 'internal' });
    expect(trafegoInterno()).toBe(true);
  });
});
