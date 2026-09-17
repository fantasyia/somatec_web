import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { MASTER_BLOCK_MODELS, emPromocao, descreverPreco } from '@/lib/constants/masterblock';
import { precificarPedido } from '@/lib/pedidos/precificar';
import { PrecoDePor } from '@/components/tools/PrecoDePor';

// =============================================================================
// "DE R$ 4.999 POR R$ 4.350" — card "Loja mostra de/por" (Léo, 17/09/2026).
//
// O que se protege aqui não é o traço na tela. É a separação entre MOSTRAR e
// COBRAR: `preco` continua sendo o valor cobrado e `precoTabela` é só o
// riscado. Foi desenhado assim porque a alternativa (o "de" em `preco`, o
// promocional num campo novo) faria todo consumidor que continuasse lendo
// `preco` — precificar, payload do ERP, GA4 — cobrar 4.999 sem nada acusar.
//
// As três coisas que este arquivo reprova:
//   1. vitrine mostrando um valor e o pedido somando outro
//   2. `precoTabela` menor ou igual ao cobrado (riscado invertido = mentira)
//   3. promoção aparecendo em modelo fora da leva decidida
//
// ⚖️ E a de fundo: riscar preço que nunca foi praticado é publicidade enganosa
// (CDC art. 37). Os valores daqui têm de ser os que estão no Tiny como tabela.
// =============================================================================

const fonte = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
const semComentarios = (s: string) =>
  s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');

/** A leva decidida no card, com os dois números de cada um. */
const LEVA: Record<string, { de: number; por: number }> = {
  'MB-01': { de: 4999, por: 4350 },
  'MB-02': { de: 6499, por: 5675 },
  'MB-03': { de: 7999, por: 6930 },
};

const modelo = (m: string) => MASTER_BLOCK_MODELS.find((x) => x.model === m)!;

describe('a leva é exatamente a do card', () => {
  it('🔴 só MB-01, MB-02 e MB-03 têm riscado — ampliar é decisão, não deriva', () => {
    const comPromo = MASTER_BLOCK_MODELS.filter(emPromocao).map((m) => m.model);
    expect(comPromo).toEqual(Object.keys(LEVA));
  });

  it.each(Object.entries(LEVA))('%s: de %o', (m, { de, por }) => {
    expect(modelo(m).precoTabela).toBe(de);
    expect(modelo(m).preco).toBe(por);
  });

  it('🔴 riscado é sempre MAIOR que o cobrado — o contrário é o traço mentindo', () => {
    for (const m of MASTER_BLOCK_MODELS) {
      if (m.precoTabela === undefined) continue;
      expect(m.precoTabela, `${m.model}: precoTabela <= preco`).toBeGreaterThan(m.preco);
    }
  });

  it('modelo sem precoTabela não está em promoção', () => {
    expect(emPromocao(modelo('MB-04'))).toBe(false);
    expect(emPromocao({ preco: 100, precoTabela: 100 })).toBe(false);
  });
});

describe('🔴 vitrine e cobrança são o MESMO número', () => {
  // É o jeito de o bug nascer: a tela mostra 4.350 e o servidor soma 4.999,
  // ou o inverso. Os dois lêem a mesma constante — este teste garante que
  // continuam lendo o mesmo CAMPO dela.
  it.each(Object.keys(LEVA))('%s: o servidor cobra o "por", nunca o "de"', (m) => {
    const r = precificarPedido(
      [{ descricao: 'x', modelo: m, quantidade: 1 }],
      { totalCentavos: 0, freteCentavos: 0 },
      false,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.itens[0].precoCentavos).toBe(LEVA[m].por * 100);
    expect(r.itens[0].precoCentavos).not.toBe(LEVA[m].de * 100);
  });

  it('precificar não conhece precoTabela — a cobrança não tem como derivar pro "de"', () => {
    expect(semComentarios(fonte('src/lib/pedidos/precificar.ts'))).not.toContain('precoTabela');
  });

  it('o payload pro ERP também não — valorUnitario sai de precoCentavos', () => {
    expect(semComentarios(fonte('src/lib/betinna/pedidos.ts'))).not.toContain('precoTabela');
  });
});

describe('o que a tela mostra', () => {
  it('com promoção: riscado com o "de", e o "por" em texto normal', () => {
    const html = renderToStaticMarkup(<PrecoDePor modelo={modelo('MB-01')} />);
    expect(html).toMatch(/<s[^>]*>R\$\s?4\.999<\/s>/);
    expect(html).toMatch(/>R\$\s?4\.350</);
  });

  it('leitor de tela ouve "de … por …" — <s> sozinho não é anunciado', () => {
    const html = renderToStaticMarkup(<PrecoDePor modelo={modelo('MB-01')} />);
    expect(html).toMatch(/sr-only[^>]*>de\s*</);
    expect(html).toMatch(/4\.999 por/);
  });

  it('sem promoção: só o preço, sem <s> nenhum', () => {
    const html = renderToStaticMarkup(<PrecoDePor modelo={modelo('MB-04')} />);
    // `<s` casaria com `<span` — a tag riscada é `<s>` ou `<s class=…>`.
    expect(html).not.toMatch(/<s[\s>]/);
    expect(html).toMatch(/R\$\s?8\.290/);
  });

  it('o resumo em texto (lead / WhatsApp) fala os dois números', () => {
    expect(descreverPreco(modelo('MB-01'))).toMatch(/^de R\$\s?4\.999 por R\$\s?4\.350$/);
    expect(descreverPreco(modelo('MB-04'))).toMatch(/^R\$\s?8\.290$/);
  });
});

describe('contraste do riscado no painel escuro', () => {
  it('🔴 default do riscado não pode ficar abaixo de white/60 — 4,5:1 em 12px sobre #002B47', () => {
    // Medido em 17/09 sobre `bg-deep_navy` (#002B47), o fundo real do carrinho:
    // white/45 = 4,06:1 (reprova) · white/60 = 6,11:1 · white/70 = 7,78:1.
    // Quem "clarear o traço pra ficar discreto" volta a reprovar a11y sem
    // nenhum teste de token acusar — `/45` é classe válida do Tailwind.
    const codigo = semComentarios(fonte('src/components/tools/PrecoDePor.tsx'));
    const m = codigo.match(/classNameDe = 'text-white\/(\d+)'/);
    expect(m, 'default do riscado tem de ser text-white/NN').not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(60);
  });
});

describe('o checkout usa o componente nos dois lugares', () => {
  const codigo = semComentarios(fonte('src/components/tools/CheckoutNI.tsx'));

  it('carrinho e resumo renderizam PrecoDePor', () => {
    expect(codigo.match(/<PrecoDePor/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('🔴 não sobrou preço de item formatado à mão — voltaria a esconder o riscado', () => {
    expect(codigo).not.toMatch(/formatBRL\(item\.modelo\.preco\)/);
    expect(codigo).not.toMatch(/formatBRL\(i\.modelo\?\.preco/);
    expect(codigo).not.toMatch(/formatBRL\(modelo\.preco\)/);
  });
});
