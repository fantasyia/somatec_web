import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MullerBotPayload } from '@/lib/mullerbot/payload';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// A REDE EMBAIXO DO LEAD.
//
// O lead do pedido saía do NAVEGADOR, numa segunda chamada depois de
// `/api/pedidos` já ter dado 201. Se ela falhasse — captcha, rede, aba fechada
// — o pedido existia e o lead não, e nada acusava.
//
// O que se protege aqui é a ORDEM: enfileirar PRIMEIRO, mandar DEPOIS. Mandar
// direto e só enfileirar no erro perderia o lead quando o próprio processo cai
// no meio do envio — que é justamente quando ninguém está olhando.
// =============================================================================

const enqueueMock = vi.fn<() => Promise<void>>();
const markSentMock = vi.fn();
const markAttemptMock = vi.fn();
const sendMock = vi.fn();
const ordem: string[] = [];

vi.mock('@/lib/webhook-queue', () => ({
  enqueueSubmission: async () => {
    ordem.push('enfileirou');
    return enqueueMock();
  },
  markSent: (...a: unknown[]) => markSentMock(...a),
  markAttempt: (...a: unknown[]) => markAttemptMock(...a),
}));

vi.mock('@/lib/betinna/client', () => ({
  sendToBetinna: async () => {
    ordem.push('enviou');
    return sendMock();
  },
}));

const payload = { name: 'Fulano' } as unknown as MullerBotPayload;
const ctx = { sourcePage: '/protecao-residencial', sourceIp: '1.2.3.4' };

beforeEach(() => {
  // Limpa o HISTÓRICO antes de reprogramar. Sem isto as chamadas de um teste
  // contam no seguinte, e as asserções de "não foi chamado" passam ou falham
  // pelo motivo errado.
  vi.clearAllMocks();
  ordem.length = 0;
  enqueueMock.mockResolvedValue(undefined);
  sendMock.mockResolvedValue({ result: 'sent', status: 200, externalId: 'x1' });
  markSentMock.mockResolvedValue(undefined);
  markAttemptMock.mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('entrega bem-sucedida', () => {
  it('enfileira ANTES de mandar — a ordem é a proteção', async () => {
    const { entregarLead } = await import('@/lib/leads/entregar');
    await entregarLead(payload, ctx);
    expect(ordem).toEqual(['enfileirou', 'enviou']);
  });

  it('deu certo: marca como enviado e responde `enviado`', async () => {
    const { entregarLead } = await import('@/lib/leads/entregar');
    expect(await entregarLead(payload, ctx)).toBe('enviado');
    expect(markSentMock).toHaveBeenCalledTimes(1);
    expect(markAttemptMock).not.toHaveBeenCalled();
  });
});

describe('o envio falha — é aqui que a fila salva', () => {
  it('a linha FICA na fila pro cron retentar', async () => {
    sendMock.mockResolvedValue({ result: 'error', status: 500 });
    const { entregarLead } = await import('@/lib/leads/entregar');
    expect(await entregarLead(payload, ctx)).toBe('na_fila');
    expect(markAttemptMock).toHaveBeenCalledTimes(1);
    expect(markSentMock).not.toHaveBeenCalled();
  });

  it('`na_fila` NÃO é falha — o lead está garantido, só não entregue ainda', async () => {
    // O checkout usa esta distinção pra decidir se manda de novo do navegador.
    // Tratar `na_fila` como falha faria o CRM receber o lead duas vezes.
    sendMock.mockResolvedValue({ result: 'error', status: 502 });
    const { entregarLead } = await import('@/lib/leads/entregar');
    expect(await entregarLead(payload, ctx)).not.toBe('nao_enfileirado');
  });
});

describe('nem a fila aceitou — o caso sem rede', () => {
  it('ainda tenta mandar solto: melhor entregue sem rastro que perdido', async () => {
    enqueueMock.mockRejectedValue(new Error('supabase fora'));
    sendMock.mockResolvedValue({ result: 'sent', status: 200 });
    const { entregarLead } = await import('@/lib/leads/entregar');
    expect(await entregarLead(payload, ctx)).toBe('enviado');
    expect(ordem).toEqual(['enfileirou', 'enviou']);
  });

  it('sem fila E sem envio, avisa `nao_enfileirado` — aí o checkout tenta pelo navegador', async () => {
    enqueueMock.mockRejectedValue(new Error('supabase fora'));
    sendMock.mockResolvedValue({ result: 'error', status: 500 });
    const { entregarLead } = await import('@/lib/leads/entregar');
    expect(await entregarLead(payload, ctx)).toBe('nao_enfileirado');
    // Sem linha na fila, não há o que marcar.
    expect(markAttemptMock).not.toHaveBeenCalled();
    expect(markSentMock).not.toHaveBeenCalled();
  });
});

// =============================================================================
// NÃO DUPLICAR.
//
// Ao mover a entrega do lead pro servidor, apareceu um risco novo: os DOIS
// mandarem. O `/api/pedidos` responde `leadEnviado`, e o checkout só usa o
// caminho antigo quando esse sinal não vem.
//
// Estas guardas leem a fonte porque o que se protege é a LIGAÇÃO — as regras
// puras acima passariam igual com o checkout mandando em duplicidade.
// =============================================================================

describe('o checkout não manda o lead duas vezes', () => {
  const semComentarios = (rel: string) =>
    readFileSync(resolve(process.cwd(), rel), 'utf-8')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n');

  const CHECKOUT = semComentarios('src/components/tools/CheckoutNI.tsx');
  const ROTA = semComentarios('src/app/api/pedidos/route.ts');

  it('a rota do pedido devolve `leadEnviado`', () => {
    expect(ROTA).toMatch(/leadEnviado/);
  });

  it('a rota entrega o lead pelo servidor', () => {
    expect(ROTA).toMatch(/entregarLeadDoPedido\(/);
  });

  it('sem consentimento a rota NÃO entrega lead', () => {
    // Mesma regra do /api/forms/submit. O pedido é registrado do mesmo jeito.
    expect(ROTA).toMatch(/lgpdConsent !== true/);
  });

  it('o checkout PULA o envio quando o servidor já entregou', () => {
    expect(CHECKOUT).toMatch(/leadJaEntregue/);
    expect(CHECKOUT).toMatch(/if \(!leadJaEntregue\)/);
  });

  it('o checkout manda resumo e consentimento pra rota montar o lead', () => {
    const i = CHECKOUT.indexOf("fetch('/api/pedidos'");
    expect(i, 'nao achei a chamada do pedido').toBeGreaterThan(-1);
    const bloco = CHECKOUT.slice(i, i + 1400);
    expect(bloco).toMatch(/resumo:/);
    expect(bloco).toMatch(/lgpdConsent:/);
  });

  it('o caminho antigo CONTINUA existindo — orçamento não cria pedido', () => {
    // Apagar o envio do cliente mataria o lead de quem só pede orçamento.
    expect(CHECKOUT).toMatch(/checkout-ni-orcamento/);
    expect(CHECKOUT).toMatch(/enviarLeadOrcamento\(/);
  });
});
