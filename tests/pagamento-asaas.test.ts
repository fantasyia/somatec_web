import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EVENTOS_CANCELADO,
  EVENTOS_PAGO,
  asaasConfigurado,
  criarCobranca,
  webhookAutentico,
} from '@/lib/pagamento/asaas';
import { FORMAS_PAGAMENTO, FORMA_NO_GATEWAY } from '@/lib/constants/pagamento';

/**
 * Cobrança do checkout (Asaas).
 *
 * O que estes testes protegem é o que dói em dinheiro: o webhook não pode
 * aceitar chamada de estranho, a cobrança tem que carregar o número do pedido
 * (senão "pagou" chega sem dizer de quem), e o valor tem que sair em reais —
 * o site inteiro trabalha em centavos, e um fator 100 errado aqui cobra cem
 * vezes menos ou cem vezes mais.
 */
const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.ASAAS_BASE_URL = 'https://api-sandbox.asaas.com/v3';
  process.env.ASAAS_API_KEY = 'chave-de-teste';
  process.env.ASAAS_WEBHOOK_TOKEN = 'token-secreto-do-webhook';
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.unstubAllGlobals();
});

/** Respostas na ordem: busca de cliente, criação de cliente, criação da cobrança. */
const responder = (respostas: unknown[]) => {
  const fetchMock = vi.fn();
  for (const r of respostas) {
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify(r) });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const corpoDaChamada = (fetchMock: ReturnType<typeof vi.fn>, i: number) =>
  JSON.parse((fetchMock.mock.calls[i][1] as { body: string }).body) as Record<string, unknown>;

describe('cobrança', () => {
  it('reaproveita o cliente que já existe pelo CPF/CNPJ', async () => {
    // Sem isso, cada compra cria um cadastro novo da mesma pessoa: o painel
    // financeiro vira lista de duplicatas e o histórico de quem já comprou some.
    const f = responder([
      { data: [{ id: 'cus_existente', name: 'Ana', email: 'ana@x.com' }] },
      { id: 'pay_1', invoiceUrl: 'https://sandbox.asaas.com/i/1', status: 'PENDING' },
    ]);

    await criarCobranca({
      numeroPedido: 'SB-2609-000123',
      cliente: { nome: 'Ana', email: 'ana@x.com', cpfCnpj: '191.312.430/0019-7' },
      valorCentavos: 125_00,
      forma: 'PIX',
    });

    expect(f).toHaveBeenCalledTimes(2); // buscou e cobrou — não criou cliente
    expect(corpoDaChamada(f, 1).customer).toBe('cus_existente');
  });

  it('ATUALIZA o cadastro reaproveitado quando o comprador mudou', async () => {
    // Peguei isso em teste: a página de pagamento mostrava "Dados do comprador"
    // com o nome do PRIMEIRO cadastro feito com aquele CNPJ. Quem compra hoje
    // veria um nome que não é o dele na hora de pagar — e as notificações do
    // gateway iriam pro e-mail antigo.
    const f = responder([
      { data: [{ id: 'cus_1', name: 'Nome Antigo', email: 'antigo@x.com' }] },
      { id: 'cus_1' },
      { id: 'pay_1', invoiceUrl: 'https://x/i/1', status: 'PENDING' },
    ]);

    await criarCobranca({
      numeroPedido: 'SB-1',
      cliente: { nome: 'Ana Nova', email: 'ana@x.com', cpfCnpj: '19131243000197' },
      valorCentavos: 1000,
      forma: 'PIX',
    });

    expect(f.mock.calls[1][0]).toContain('/customers/cus_1');
    expect(corpoDaChamada(f, 1)).toMatchObject({ name: 'Ana Nova', email: 'ana@x.com' });
    expect(corpoDaChamada(f, 2).customer).toBe('cus_1'); // cobrou no MESMO cadastro
  });

  it('não gasta chamada quando o cadastro já está igual', async () => {
    const f = responder([
      { data: [{ id: 'cus_1', name: 'Ana', email: 'ANA@x.com' }] },
      { id: 'pay_1', invoiceUrl: 'https://x/i/1', status: 'PENDING' },
    ]);

    await criarCobranca({
      numeroPedido: 'SB-1',
      cliente: { nome: 'Ana', email: 'ana@x.com', cpfCnpj: '19131243000197' },
      valorCentavos: 1000,
      forma: 'PIX',
    });

    expect(f).toHaveBeenCalledTimes(2); // buscou e cobrou, sem update
  });

  it('falha ao atualizar não derruba a venda', async () => {
    // O pior caso é voltar a mostrar o dado velho — que é o comportamento de
    // antes. Perder a cobrança por causa disso seria trocar um defeito cosmético
    // por um pedido não pago.
    const f = vi.fn();
    f.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ data: [{ id: 'cus_1', name: 'Velho', email: 'v@x.com' }] }),
    });
    f.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ errors: [{ description: 'qualquer coisa' }] }),
    });
    f.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ id: 'pay_1', invoiceUrl: 'https://x/i/1', status: 'PENDING' }),
    });
    vi.stubGlobal('fetch', f);

    const r = await criarCobranca({
      numeroPedido: 'SB-1',
      cliente: { nome: 'Ana', email: 'ana@x.com', cpfCnpj: '19131243000197' },
      valorCentavos: 1000,
      forma: 'PIX',
    });

    expect(r.url).toBe('https://x/i/1');
  });

  it('cria o cliente quando não existe, só com dígitos no documento', async () => {
    const f = responder([
      { data: [] },
      { id: 'cus_novo' },
      { id: 'pay_1', invoiceUrl: 'https://x/i/1', status: 'PENDING' },
    ]);

    await criarCobranca({
      numeroPedido: 'SB-1',
      cliente: { nome: 'Ana', email: 'ana@x.com', cpfCnpj: '191.312.430/0019-7' },
      valorCentavos: 1000,
      forma: 'PIX',
    });

    expect(corpoDaChamada(f, 1).cpfCnpj).toBe('19131243000197');
  });

  it('manda o VALOR em reais e o NÚMERO DO PEDIDO como referência', async () => {
    const f = responder([
      { data: [{ id: 'cus_1', name: 'Ana', email: 'ana@x.com' }] },
      { id: 'pay_1', invoiceUrl: 'https://x/i/1', status: 'PENDING' },
    ]);

    const r = await criarCobranca({
      numeroPedido: 'SB-2609-000123',
      cliente: { nome: 'Ana', email: 'ana@x.com', cpfCnpj: '19131243000197' },
      valorCentavos: 1_234_56,
      forma: 'CREDIT_CARD',
    });

    const corpo = corpoDaChamada(f, 1);
    // Centavos → reais. Errar o fator aqui cobra 100x a mais ou a menos.
    expect(corpo.value).toBe(1234.56);
    // É por esta referência que o webhook sabe QUAL pedido foi pago.
    expect(corpo.externalReference).toBe('SB-2609-000123');
    expect(corpo.billingType).toBe('CREDIT_CARD');
    expect(r.url).toBe('https://x/i/1');
  });

  it('erro do Asaas vira mensagem legível, não "HTTP 400"', async () => {
    // O motivo vem em `errors[].description`. Sem extrair, ninguém descobre que
    // faltou o CPF — e o log vira um número.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({ errors: [{ description: 'O CPF/CNPJ informado é inválido.' }] }),
      }),
    );

    await expect(
      criarCobranca({
        numeroPedido: 'SB-1',
        cliente: { nome: 'Ana', email: 'a@x.com', cpfCnpj: '123' },
        valorCentavos: 100,
        forma: 'PIX',
      }),
    ).rejects.toThrow(/CPF\/CNPJ informado é inválido/);
  });

  it('sem chave configurada, o gateway se declara desligado', () => {
    delete process.env.ASAAS_API_KEY;

    expect(asaasConfigurado()).toBe(false);
  });
});

describe('autenticação do webhook', () => {
  it('token certo passa; errado e ausente não', () => {
    expect(webhookAutentico('token-secreto-do-webhook')).toBe(true);
    expect(webhookAutentico('outro-token-qualquer')).toBe(false);
    expect(webhookAutentico(null)).toBe(false);
  });

  it('sem token no ambiente, RECUSA — falha fechado', () => {
    // A URL do webhook é pública. Aceitar sem conferir deixaria qualquer um
    // marcar pedido como pago; a dúvida aqui é "esse dinheiro entrou mesmo?".
    delete process.env.ASAAS_WEBHOOK_TOKEN;

    expect(webhookAutentico('token-secreto-do-webhook')).toBe(false);
  });
});

describe('eventos', () => {
  it('separa o que é dinheiro que entrou do que é dinheiro que não entrou', () => {
    expect(EVENTOS_PAGO.has('PAYMENT_RECEIVED')).toBe(true);
    expect(EVENTOS_PAGO.has('PAYMENT_CONFIRMED')).toBe(true);
    expect(EVENTOS_CANCELADO.has('PAYMENT_REFUNDED')).toBe(true);
    // Evento de criação NÃO é pagamento — é o mais comum no volume.
    expect(EVENTOS_PAGO.has('PAYMENT_CREATED')).toBe(false);
    expect(EVENTOS_CANCELADO.has('PAYMENT_CREATED')).toBe(false);
  });
});

describe('formas de pagamento', () => {
  it('só PIX e cartão — boleto saiu por decisão do Léo', () => {
    expect(FORMAS_PAGAMENTO.map((f) => f.id)).toEqual(['pix', 'cartao']);
  });

  it('toda forma da tela sabe virar forma do gateway', () => {
    // Forma nova na lista sem tradução aqui viraria `undefined` no `billingType`
    // e o Asaas recusaria a cobrança inteira.
    for (const f of FORMAS_PAGAMENTO) {
      expect(FORMA_NO_GATEWAY[f.id]).toBeTruthy();
    }
  });
});
