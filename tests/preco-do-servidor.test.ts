import { describe, expect, it } from 'vitest';
import { precificarPedido, precoDoModelo } from '@/lib/pedidos/precificar';
import { MASTER_BLOCK_MODELS } from '@/lib/constants/masterblock';

/**
 * Preço vem do CATÁLOGO, nunca do navegador.
 *
 * A brecha existia inerte enquanto não havia pagamento online: `totalCentavos`
 * chegava do cliente e só sujava o registro do pedido — alguém da equipe
 * cobrava o valor certo na mão. Ligado o gateway, esse mesmo número passou a
 * definir QUANTO O CLIENTE PAGA, e um POST com `totalCentavos: 100` compraria
 * um equipamento de R$ 4.350,00 por um real.
 *
 * O corpo da requisição vale como intenção de compra — qual modelo, quantas
 * unidades. Preço e frete são resolvidos aqui.
 */
const MB01 = MASTER_BLOCK_MODELS[0];

const item = (over: Record<string, unknown> = {}) => ({
  descricao: 'Quadro de entrada',
  modelo: MB01.model,
  quantidade: 1,
  precoCentavos: Math.round(MB01.preco * 100),
  ...over,
});

describe('preço do pedido', () => {
  it('sai do catálogo, ignorando o que o cliente afirmou', () => {
    const r = precificarPedido([item({ precoCentavos: 100 })], { totalCentavos: 100 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itens[0].precoCentavos).toBe(Math.round(MB01.preco * 100));
    expect(r.totalCentavos).toBe(Math.round(MB01.preco * 100));
  });

  it('acusa a divergência com sinal e tamanho — é o que vira alarme no log', () => {
    const real = Math.round(MB01.preco * 100);
    const r = precificarPedido([item()], { totalCentavos: 100 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.divergenciaCentavos).toBe(real - 100);
  });

  it('pedido honesto não acusa divergência nenhuma', () => {
    const real = Math.round(MB01.preco * 100);
    const r = precificarPedido([item()], { totalCentavos: real });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.divergenciaCentavos).toBe(0);
  });

  it('modelo que não existe é RECUSADO, não precificado pelo que o cliente mandou', () => {
    // Aceitar "MB-99" com preço do corpo é a mesma brecha por outra porta.
    const r = precificarPedido([item({ modelo: 'MB-99' })], { totalCentavos: 100 });

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe('modelo_desconhecido');
  });

  it('quantidade multiplica o preço de tabela', () => {
    const r = precificarPedido([item({ quantidade: 3 })]);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.totalCentavos).toBe(Math.round(MB01.preco * 100) * 3);
  });

  it('quantidade absurda é limitada — senão vira outro jeito de estourar o valor', () => {
    const r = precificarPedido([item({ quantidade: 999_999 })]);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itens[0].quantidade).toBe(50);
  });

  it('linha sem modelo vale zero e não impede o pedido', () => {
    // O carrinho aceita linha de contexto (o quadro que a pessoa descreveu),
    // que não é produto — recusar isso quebraria pedido legítimo.
    const r = precificarPedido([item(), { descricao: 'Quadro do galpão', modelo: null }]);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.totalCentavos).toBe(Math.round(MB01.preco * 100));
  });

  it('o frete também é do servidor — o cliente não escolhe o próprio frete', () => {
    const r = precificarPedido([item()], { totalCentavos: 999, freteCentavos: 999_999 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.freteCentavos).toBe(0); // promoção vigente: frete grátis
  });

  it('todo modelo do catálogo tem preço resolvível', () => {
    // Modelo novo na tabela sem preço viraria pedido de valor zero.
    for (const m of MASTER_BLOCK_MODELS) {
      expect(precoDoModelo(m.model), m.model).toBeGreaterThan(0);
    }
    expect(precoDoModelo('mb-01')).toBe(precoDoModelo('MB-01')); // caixa não importa
    expect(precoDoModelo('')).toBeNull();
  });
});
