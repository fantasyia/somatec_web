import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { precificarPedido, SKU_TESTE } from '@/lib/pedidos/precificar';
import {
  comDescontoPix,
  temDescontoPix,
  formaPagamentoDe,
  DESCONTO_PIX_PERCENTUAL,
  FORMAS_PAGAMENTO,
} from '@/lib/constants/pagamento';

// =============================================================================
// 6% NO PIX À VISTA — decisão do Léo, 23/09/2026.
//
// O que este arquivo protege não é o desconto: é os QUATRO números baterem.
// O mesmo pedido é escrito em quatro lugares, e cada um tem um jeito próprio de
// ficar para trás:
//
//   tela        o que a pessoa vê antes de clicar
//   cobrança    o que o Asaas cobra
//   pedido      o que fica registrado (e vira `purchase` no GA4 e na Meta)
//   ERP         o que a NOTA FISCAL fatura
//
// O ERP é o mais perigoso, porque ele recebe **preço unitário e não tem campo
// de desconto**: se o desconto fosse aplicado só no total, o cliente pagaria
// R$ 4.089 e a nota sairia de R$ 4.350. Ninguém veria até a conciliação.
//
// Por isso a regra é por UNIDADE, e por isso ela mora dentro do
// `precificarPedido` — de lá ela alcança os quatro sozinha.
// =============================================================================

const fonte = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
const item = (modelo: string, quantidade = 1) => ({ descricao: 'Quadro', modelo, quantidade });
const precificar = (modelo: string, forma?: string | null, qtd = 1) =>
  precificarPedido([item(modelo, qtd)], undefined, false, forma);

/** Os três modelos da leva, com o cheio e o esperado com 6%. */
const TABELA = [
  { modelo: 'MB-01', cheio: 435_000, comPix: 408_900 },
  { modelo: 'MB-02', cheio: 567_500, comPix: 533_450 },
  { modelo: 'MB-03', cheio: 693_000, comPix: 651_420 },
] as const;

describe('quem ganha o desconto', () => {
  it.each(TABELA)('$modelo: PIX paga $comPix, cheio é $cheio', ({ modelo, cheio, comPix }) => {
    const pix = precificar(modelo, 'PIX');
    const cartao = precificar(modelo, 'Cartão de crédito');
    expect(pix.ok && pix.itens[0].precoCentavos).toBe(comPix);
    expect(cartao.ok && cartao.itens[0].precoCentavos).toBe(cheio);
  });

  it('🔴 cartão em 1x É à vista e mesmo assim NÃO ganha — foi decisão, não esquecimento', () => {
    // Os 6% compensam a taxa do cartão e o ganho de caixa do PIX. Dar o mesmo
    // no cartão é pagar pra receber pior. Se alguém "uniformizar" isso achando
    // que à vista é à vista, este teste é o aviso.
    const r = precificar('MB-01', 'cartao');
    expect(r.ok && r.totalCentavos).toBe(435_000);
  });

  it('🔴 sem forma de pagamento NÃO ganha desconto — omissão não pode valer 6%', () => {
    // O caminho seguro do erro é cobrar o valor cheio. Um POST sem
    // `formaPagamento` ganhando desconto seria brecha de preço por omissão.
    for (const forma of [undefined, null, '', '  ', 'boleto', 'PIX ', 'pix.']) {
      const r = precificarPedido([item('MB-01')], undefined, false, forma as string | null);
      const esperado = forma === 'PIX ' ? 408_900 : 435_000; // só o espaço é tolerado
      expect(r.ok && r.totalCentavos, `forma=${JSON.stringify(forma)}`).toBe(esperado);
    }
  });

  it('aceita tanto o id quanto o rótulo — o checkout manda o rótulo', () => {
    expect(formaPagamentoDe('pix')).toBe('pix');
    expect(formaPagamentoDe('PIX')).toBe('pix');
    expect(formaPagamentoDe('Cartão de crédito')).toBe('cartao');
    expect(formaPagamentoDe('qualquer outra coisa')).toBeNull();
    expect(temDescontoPix('Cartão de crédito')).toBe(false);
  });

  it('⛔ compatibilidade: chamada de 3 argumentos continua sem desconto', () => {
    // Era o comportamento de antes de 23/09. Se alguém tornar o desconto o
    // padrão, todo consumidor antigo passa a cobrar 6% a menos calado.
    const r = precificarPedido([item('MB-01')], undefined, false);
    expect(r.ok && r.totalCentavos).toBe(435_000);
  });
});

describe('🔴 o desconto é por UNIDADE — é o que faz a nota bater', () => {
  it('total é a soma exata dos unitários, com quantidade > 1', () => {
    const r = precificar('MB-02', 'PIX', 3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 533450 × 3 — e NÃO `round(567500 × 3 × 0,94)`, que daria outro centavo.
    expect(r.itens[0].precoCentavos).toBe(533_450);
    expect(r.totalCentavos).toBe(533_450 * 3 + r.freteCentavos);
  });

  it.each([1, 2, 3, 7, 50])('com %i unidade(s), total == soma(unitário × qtd) + frete', (qtd) => {
    const r = precificar('MB-03', 'PIX', qtd);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const soma = r.itens.reduce((s, i) => s + i.precoCentavos * i.quantidade, 0);
    expect(r.totalCentavos).toBe(soma + r.freteCentavos);
  });

  it('🔴 o unitário que vai pro ERP JÁ vem descontado (caminho A)', () => {
    // O payload do ERP (`src/lib/betinna/pedidos.ts`) lê `precoCentavos` item a
    // item e não tem campo de desconto. Então o desconto TEM de estar no
    // unitário — senão a NF sai cheia e o caixa recebe menos.
    const r = precificar('MB-01', 'PIX');
    expect(r.ok && r.itens[0].precoCentavos).toBe(408_900);
    const erp = fonte('src/lib/betinna/pedidos.ts');
    expect(erp, 'o ERP continua lendo precoCentavos — se mudar, revalidar isto').toContain(
      'precoCentavos',
    );
  });
});

describe('🔴 o frete nunca entra no desconto', () => {
  it('o frete do resultado é o mesmo com e sem PIX', () => {
    const pix = precificar('MB-01', 'PIX');
    const cartao = precificar('MB-01', 'cartao');
    expect(pix.ok && cartao.ok && pix.freteCentavos).toBe(cartao.ok ? cartao.freteCentavos : -1);
  });

  it('a diferença entre cheio e com PIX é exatamente 6% do PRODUTO', () => {
    const pix = precificar('MB-01', 'PIX');
    const cartao = precificar('MB-01', 'cartao');
    if (!pix.ok || !cartao.ok) throw new Error('precificação falhou');
    expect(cartao.totalCentavos - pix.totalCentavos).toBe(Math.round(435_000 * 0.06));
  });
});

describe('a conta em si', () => {
  it('comDescontoPix tira exatamente o percentual declarado', () => {
    expect(comDescontoPix(100_00)).toBe(94_00);
    expect(DESCONTO_PIX_PERCENTUAL).toBe(6);
  });

  it('arredonda pro centavo, sem fração', () => {
    // 1 centavo com 6% = 0,94 centavo. Tem de virar 1, não 0,94.
    expect(Number.isInteger(comDescontoPix(1))).toBe(true);
    expect(Number.isInteger(comDescontoPix(333))).toBe(true);
  });

  it('o SKU de teste segue a mesma regra — é forma de pagamento, não produto', () => {
    const r = precificarPedido([item(SKU_TESTE)], undefined, true, 'PIX');
    expect(r.ok && r.itens[0].precoCentavos).toBe(940);
  });
});

describe('a tela não pode divergir do servidor', () => {
  const checkout = fonte('src/components/tools/CheckoutNI.tsx');

  it('🔴 o payload manda o total COM desconto', () => {
    // Se a tela mandar o cheio, o servidor recalcula com desconto, acha
    // divergência e RECUSA o pedido — o cliente vê "não conseguimos confirmar o
    // preço" sem nada de errado ter acontecido.
    expect(checkout).toMatch(/totalCentavos: totalCentavosPedido/);
  });

  it('🔴 a tela calcula item a item, igual ao servidor', () => {
    expect(checkout).toContain('comDescontoPix');
    expect(checkout).toMatch(/descontoPixCentavos[\s\S]{0,200}reduce/);
  });

  it('a parcela do cartão usa o total CHEIO', () => {
    expect(checkout).toMatch(/valorDaParcela\(totalCentavosCheio/);
    expect(checkout).toMatch(/parcelasDisponiveis\(totalCentavosCheio\)/);
  });

  it('🔴 o `pedido_registrado` mede o valor COBRADO, não o cheio', () => {
    // ⚠️ O `begin_checkout` (`rastrearInicioCheckout`) continua usando o total
    // CHEIO, e está certo: ele dispara antes de a pessoa escolher a forma de
    // pagamento, quando ainda não existe desconto. A primeira versão desta
    // guarda proibia `value: totalPedido` no arquivo inteiro e reprovava ele.
    const i = checkout.indexOf('rastrearPedidoRegistrado({');
    expect(i, 'o disparo do pedido sumiu do checkout').toBeGreaterThan(0);
    const bloco = checkout.slice(i, i + 900);
    expect(bloco).toContain('value: totalCentavosPedido / 100');
    expect(bloco).not.toMatch(/value:\s*totalPedido/);
  });

  it('o rótulo do PIX anuncia o desconto a partir da constante', () => {
    const pix = FORMAS_PAGAMENTO.find((f) => f.id === 'pix')!;
    expect(pix.detalhe).toContain(`${DESCONTO_PIX_PERCENTUAL}%`);
    // Escrito à mão, o rótulo continuaria dizendo 6% depois de a regra mudar.
    expect(fonte('src/lib/constants/pagamento.ts')).toMatch(
      /detalhe: `\$\{DESCONTO_PIX_PERCENTUAL\}%/,
    );
  });
});
