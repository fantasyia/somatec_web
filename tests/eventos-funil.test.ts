import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// EVENTOS DE FUNIL — o contrato com Google Ads e Meta.
//
// Taxonomia definida pela sessão de Ads em 08/09. O que estes testes protegem
// não é a escrita do evento, é a SEMÂNTICA: um nome errado ou um `motor`
// chutado não quebra nada na tela — treina a campanha no público errado e
// queima verba, e ninguém descobre olhando o site.
// =============================================================================

const trackEvent = vi.fn();
vi.mock('@/lib/analytics', () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));
vi.mock('@/lib/attribution', () => ({
  getAtribuicao: () => ({ primeiro: { utmCampaign: 'campanha-x' }, ultimo: {} }),
}));

const {
  novoEventId,
  rastrearLead,
  rastrearInicioCheckout,
  rastrearPedidoRegistrado,
} = await import('@/lib/analytics/eventos');

beforeEach(() => trackEvent.mockClear());

const ultimo = () => trackEvent.mock.calls.at(-1) as [string, Record<string, unknown>];

describe('parâmetros comuns — em todo evento', () => {
  it('carrega motor, event_id e a campanha do primeiro toque', () => {
    rastrearLead({ formId: 'contato', motor: 'industrial' });
    const [nome, params] = ultimo();
    expect(nome).toBe('generate_lead');
    expect(params.motor).toBe('industrial');
    expect(params.utm_campaign).toBe('campanha-x');
    expect(String(params.event_id)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('o event_id devolvido é o MESMO que foi emitido — é o que dedupa o CAPI', () => {
    const id = rastrearLead({ formId: 'contato', motor: 'industrial' });
    expect(ultimo()[1].event_id).toBe(id);
  });

  it('respeita um event_id vindo de fora (o que o servidor vai reusar)', () => {
    rastrearLead({ formId: 'representante', motor: 'representante', eventId: 'fixo-123' });
    expect(ultimo()[1].event_id).toBe('fixo-123');
  });

  it('cada evento tem id próprio — nunca um por sessão', () => {
    const a = rastrearLead({ formId: 'contato', motor: 'industrial' });
    const b = rastrearPedidoRegistrado({ transactionId: 'SB1', value: 10, items: [] });
    expect(a).not.toBe(b);
    expect(novoEventId()).not.toBe(novoEventId());
  });
});

describe('os quatro motores', () => {
  it('representante NÃO é motor de venda', () => {
    // Cair como industrial misturaria candidato a rep com cliente industrial
    // no mesmo público de anúncio.
    rastrearLead({ formId: 'representante', motor: 'representante' });
    expect(ultimo()[1].motor).toBe('representante');
  });

  it('indefinido é resposta legítima quando o caminho não revela o público', () => {
    rastrearLead({ formId: 'seletor', motor: 'indefinido' });
    expect(ultimo()[1].motor).toBe('indefinido');
  });

  it('checkout e pedido são sempre não-industriais', () => {
    rastrearInicioCheckout({ value: 100, items: [] });
    expect(ultimo()[1].motor).toBe('nao_industrial');
    rastrearPedidoRegistrado({ transactionId: 'SB2', value: 100, items: [] });
    expect(ultimo()[1].motor).toBe('nao_industrial');
  });
});

describe('⛔ purchase não existe enquanto o gateway não cobra', () => {
  it('o pedido emite `pedido_registrado`, nunca `purchase`', () => {
    rastrearPedidoRegistrado({
      transactionId: 'SB2609ABC',
      value: 1234.5,
      items: [{ item_id: 'MB-03', quantity: 1, price: 1200 }],
    });
    const [nome, params] = ultimo();
    expect(nome).toBe('pedido_registrado');
    expect(nome).not.toBe('purchase');
    expect(params.transaction_id).toBe('SB2609ABC');
    expect(params.currency).toBe('BRL');
  });

  it('nenhum arquivo de evento emite purchase hoje', () => {
    // Com GATEWAY_ATIVO=false o checkout fecha como lead. `purchase` aqui
    // ensinaria Google e Meta a caçar quem registra pedido e não paga — e o
    // algoritmo carrega esse viés mesmo depois de corrigido.
    const fonte = readFileSync(resolve(process.cwd(), 'src/lib/analytics/eventos.ts'), 'utf-8');
    const semComentarios = fonte
      .split('\n')
      .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//') && !l.trim().startsWith('/*'))
      .join('\n');
    expect(semComentarios).not.toMatch(/trackEvent\(\s*'purchase'/);
  });
});

describe('begin_checkout', () => {
  it('leva valor, moeda e itens', () => {
    rastrearInicioCheckout({
      value: 999,
      items: [{ item_id: 'MB-05', quantity: 1, price: 999 }],
    });
    const [nome, params] = ultimo();
    expect(nome).toBe('begin_checkout');
    expect(params.value).toBe(999);
    expect(params.currency).toBe('BRL');
    expect(JSON.parse(String(params.items))[0].item_id).toBe('MB-05');
  });
});
