import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// O `Purchase` DA META — a venda que o Pixel não tem como ver.
//
// O Pixel só existe enquanto a pessoa está no site, e na hora em que o dinheiro
// entra ela não está: o checkout do Asaas é hospedado, o PIX confirma minutos
// depois em outro app, o boleto pode confirmar dias depois. Então este evento
// nasce no webhook, sem gêmeo no navegador — e é justamente por não ter gêmeo
// que ele precisa de proteções próprias.
//
// Os cinco jeitos de isso dar errado, em ordem de estrago:
//
//   1. disparar no PEDIDO       → a Meta aprende a caçar quem registra e não
//      paga. É o pior de todos, porque o viés NÃO SE APAGA: corrigir o evento
//      depois não desfaz o público que o algoritmo já construiu.
//   2. contar duas vezes        → reprocessar o webhook à mão vira duas vendas
//   3. contar a PARCELA         → R$ 725 no lugar de uma venda de R$ 4.350
//   4. vazar dado pessoal       → e-mail/telefone em claro saindo pra Meta
//   5. inventar a venda         → webhook de outro sistema virando receita
//
// E o silencioso: mandar sem `fbp`/`fbc`. A venda aparece, o total fica certo,
// e nenhuma campanha recebe o crédito — o relatório mente exatamente na
// pergunta que ele existe pra responder (qual anúncio pagou a conta).
// =============================================================================

const redisStore = new Map<string, string>();
const fetchMock = vi.fn();
const consulta = vi.fn();
const contato = vi.fn();

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
  contatoDoPedido: (...a: unknown[]) => contato(...a),
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
const { guardarIdentidadeMeta } = await import('@/lib/meta/capi');

const ORIGINAL = { ...process.env };
const NUMERO = 'SB2608K7M2QX';
const EMAIL = 'Marina.Torres@Exemplo.com.BR';
const WHATSAPP = '(11) 98888-7777';


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

/** Só as chamadas que foram pra Meta — o GA4 fica fora por falta de credencial. */
const chamadasMeta = () =>
  fetchMock.mock.calls.filter((c) => String(c[0]).includes('graph.facebook.com'));

type CorpoCapi = {
  data: Array<{
    event_name: string;
    event_id: string;
    user_data: Record<string, string>;
    custom_data: Record<string, unknown>;
  }>;
};

function eventoEnviado(indice = 0) {
  const [, init] = chamadasMeta()[indice] as [string, { body: string }];
  return (JSON.parse(init.body) as CorpoCapi).data[0];
}

beforeEach(() => {
  redisStore.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '{}' });
  consulta.mockReset().mockResolvedValue(pedido());
  contato.mockReset().mockResolvedValue({
    email: EMAIL,
    primeiroNome: 'Marina',
    whatsapp: WHATSAPP,
    criadoEm: new Date().toISOString(),
    formaPagamento: 'PIX',
  });
  logs.length = 0;
  vi.stubGlobal('fetch', fetchMock);
  process.env.META_PIXEL_ID = '2632485547169632';
  process.env.META_CAPI_TOKEN = 'token-de-teste';
  // O GA4 tem arquivo próprio. Sem credencial ele sai cedo e não polui o mock.
  delete process.env.GA4_MEASUREMENT_ID;
  delete process.env.GA4_API_SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.unstubAllGlobals();
});

describe('quando o Purchase sai', () => {
  it('sai quando o pagamento CONFIRMA', async () => {
    await registrarEventoPagamento(evento());
    expect(chamadasMeta()).toHaveLength(1);
    expect(eventoEnviado().event_name).toBe('Purchase');
  });

  it('🔴 NÃO sai quando o evento é de não-pagamento', async () => {
    await registrarEventoPagamento(evento({ situacao: 'nao_pago', evento: 'PAYMENT_OVERDUE' }));
    expect(chamadasMeta()).toHaveLength(0);
  });

  it('🔴 não inventa venda: sem o pedido no banco, nada sai', async () => {
    // Webhook de um número que não é nosso. Mandar `Purchase` aqui não erraria
    // só o relatório — ensinaria a Meta com uma venda que não existiu.
    consulta.mockResolvedValue(undefined);
    await registrarEventoPagamento(evento());
    expect(chamadasMeta()).toHaveLength(0);
    expect(logs.some((l) => l.msg.includes('sem pedido pra montar o Purchase'))).toBe(true);
  });

  it('inerte sem credencial — é o estado até a sessão de Ads gerar o token', async () => {
    delete process.env.META_PIXEL_ID;
    delete process.env.META_CAPI_TOKEN;
    await registrarEventoPagamento(evento());
    expect(chamadasMeta()).toHaveLength(0);
  });
});

describe('🔴 contar duas vezes', () => {
  it('reentrega do Asaas não chega a mandar — morre na idempotência', async () => {
    const e = evento();
    await registrarEventoPagamento(e);
    await registrarEventoPagamento(e);
    expect(chamadasMeta()).toHaveLength(1);
  });

  it('🔴 o event_id é DERIVADO do pedido, não sorteado', async () => {
    // Este evento não tem gêmeo no navegador, então o `event_id` não serve pra
    // deduplicar com o Pixel — serve como rede contra reprocessamento. Sorteado
    // ele não teria valor nenhum: dois envios do mesmo pedido virariam duas
    // vendas na Meta mesmo com o Redis fazendo o trabalho dele.
    await registrarEventoPagamento(evento());
    expect(eventoEnviado().event_id).toBe(`purchase-${NUMERO}`);
  });

  it('dois pedidos diferentes não colidem', async () => {
    await registrarEventoPagamento(evento());
    const outro = 'SB2608XXXXXX';
    consulta.mockResolvedValue(pedido({ numero: outro }));
    // Cobrança própria: a idempotência casa por cobrança, não por pedido.
    await registrarEventoPagamento(
      evento({ numeroPedido: outro, eventoId: 'evt_2', cobrancaId: 'pay_2' }),
    );
    expect(eventoEnviado(0).event_id).not.toBe(eventoEnviado(1).event_id);
  });
});

describe('🔴 o valor é a VENDA, não a parcela', () => {
  it('parcelado: manda o total do pedido, não o valor do evento', async () => {
    await registrarEventoPagamento(
      evento({
        valorCentavos: 72_500,
        parcelamento: { id: 'inst_1', totalCentavos: 435_000, parcelas: 6 },
      }),
    );
    expect(eventoEnviado().custom_data.value).toBe(4350);
    expect(eventoEnviado().custom_data.value).not.toBe(725);
  });

  it('moeda e pedido vão junto — sem eles a Meta não tem o que otimizar', async () => {
    await registrarEventoPagamento(evento());
    expect(eventoEnviado().custom_data.currency).toBe('BRL');
    expect(eventoEnviado().custom_data.order_id).toBe(NUMERO);
  });

  it('os ids de item são os MESMOS do pedido_registrado e do GA4', async () => {
    await registrarEventoPagamento(evento());
    expect(eventoEnviado().custom_data.content_ids).toEqual(['MB-04']);
  });
});

describe('🔒 dado pessoal', () => {
  // Até 23/09 este bloco provava que o e-mail e o telefone do pedido saíam com
  // HASH. Agora prova que NÃO SAEM — nem com hash. O CAPI roda no servidor, e
  // servidor não passa pelo banner de cookies: quem recusava tinha os dados
  // enviados do mesmo jeito, e os documentos do site diziam o contrário. Decisão
  // do Léo: alinhar o código ao que os documentos já dizem.

  it('🔴 nem em claro, nem em hash — o dado do cliente não sai', async () => {
    await registrarEventoPagamento(evento());
    const corpo = JSON.stringify(chamadasMeta()[0][1]);
    expect(corpo).not.toContain('Marina.Torres');
    expect(corpo).not.toContain('marina.torres');
    expect(corpo).not.toContain('98888');
    // E o hash também não: `em`/`ph` são os nomes da Meta pros dois campos.
    const ud = eventoEnviado().user_data as Record<string, unknown>;
    expect(ud.em).toBeUndefined();
    expect(ud.ph).toBeUndefined();
  });

  it('🔴 o caminho do Purchase não busca contato no banco', () => {
    // ⚠️ Não dá pra afirmar isso pelo mock: `contatoDoPedido` continua sendo
    // chamado no MESMO webhook, pelo e-mail de pagamento confirmado. O que
    // precisa estar limpo é a função do Meta — enquanto ela consultasse o
    // contato, o dado ficava a uma linha de voltar ao payload.
    const src = readFileSync(resolve(process.cwd(), 'src/lib/pagamento/registro.ts'), 'utf-8');
    const corpo = src.slice(src.indexOf('async function avisarMeta'));
    // ⚠️ Cortar no primeiro `}` de coluna zero NÃO funciona: a assinatura
    // (`async function avisarMeta(params: {` … `}): Promise<void> {`) tem um
    // desses, e o corte pegava 166 caracteres. Quem achou foi a asserção de
    // tamanho abaixo — ela existe pra isso, e ficou.
    const proxima = corpo.slice(1).search(/\n(async )?function /);
    const soAFuncao = proxima > 0 ? corpo.slice(0, proxima) : corpo;
    expect(soAFuncao.length, 'o corte da função falhou — a guarda testaria nada').toBeGreaterThan(
      600,
    );
    expect(soAFuncao).not.toContain('contatoDoPedido');
  });

  it('pedido sem contato ainda manda a venda — receita não espera match', async () => {
    contato.mockResolvedValue(undefined);
    await registrarEventoPagamento(evento());
    expect(chamadasMeta()).toHaveLength(1);
    expect(eventoEnviado().user_data.em).toBeUndefined();
  });
});

describe('a atribuição guardada na criação do pedido', () => {
  it('🔴 fbp e fbc chegam no Purchase — é o que dá crédito à campanha', async () => {
    await guardarIdentidadeMeta(NUMERO, { fbp: 'fb.1.1700000000.123', fbc: 'fb.1.1700000000.abc' });
    await registrarEventoPagamento(evento());
    expect(eventoEnviado().user_data.fbp).toBe('fb.1.1700000000.123');
    expect(eventoEnviado().user_data.fbc).toBe('fb.1.1700000000.abc');
  });

  it('sem nada guardado, a venda sai mesmo assim — só perde a campanha', async () => {
    await registrarEventoPagamento(evento());
    expect(chamadasMeta()).toHaveLength(1);
    expect(eventoEnviado().user_data.fbp).toBeUndefined();
  });

  it('não grava vazio: sem fbp e sem fbc não há o que guardar', async () => {
    await guardarIdentidadeMeta(NUMERO, { fbp: null, fbc: null });
    expect(redisStore.size).toBe(0);
  });

  it('a chave é por pedido — a identidade de um não vaza pro outro', async () => {
    await guardarIdentidadeMeta(NUMERO, { fbp: 'fb.1.1.do-primeiro', fbc: null });
    consulta.mockResolvedValue(pedido({ numero: 'SB2608OUTRO1' }));
    await registrarEventoPagamento(evento({ numeroPedido: 'SB2608OUTRO1' }));
    expect(eventoEnviado().user_data.fbp).toBeUndefined();
  });
});

describe('🔴 o webhook não pode cair por causa de analytics', () => {
  it('CAPI fora do ar: o pagamento continua registrado', async () => {
    fetchMock.mockRejectedValue(new Error('rede'));
    await expect(registrarEventoPagamento(evento())).resolves.toBe('registrado');
  });

  it('CAPI recusando o evento também não derruba', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'token vencido' });
    await expect(registrarEventoPagamento(evento())).resolves.toBe('registrado');
  });
});
