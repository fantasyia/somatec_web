import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MASTER_BLOCK_MODELS } from '@/lib/constants/masterblock';
import {
  masterBlockProductSchema,
  masterBlockProdutoNiSchema,
} from '@/lib/seo/structured-data';

// =============================================================================
// A `/produtos` NÃO MOSTRA PREÇO — e o schema não anuncia preço nenhum.
//
// Este arquivo já testou o CONTRÁRIO. Em 12/09 entrou uma coluna "Preço
// (compra direta)" na tabela dos 12 modelos, com `AggregateOffer` no JSON-LD,
// pra disputar o rich result com preço. Em 13/09 o Léo desfez:
//
//   "todos os modelos são iguais, só muda a potência deles (…) não gostaria
//    que ficasse aparecendo o valor completo naquela página, não tem sentido,
//    a gente tem que falar de performance, do que ele faz, quais os
//    diferenciais"
//
// É decisão de produto, não de implementação: a página de catálogo vende o que
// o equipamento FAZ. Preço de 12 variações da mesma peça vira lista de peça de
// reposição.
//
// 🔴 O `offers` caiu JUNTO, e isso é o ponto deste arquivo. Structured data
// que não corresponde ao conteúdo visível é violação de política do Google —
// schema anunciando faixa de preço numa página sem preço é exatamente isso.
// Tirar o preço e esquecer o schema deixaria o site declarando ao Google uma
// oferta que nenhuma página mostra, e ninguém veria: JSON-LD não aparece na
// tela.
//
// ⚠️ O que se perde: sem `offers` não há card com preço no resultado de busca
// — o formato com que Clamper, Intelbras e Mercado Livre ocupam "protetor de
// surto". O custo está registrado; a decisão é do Léo.
//
// ℹ️ O preço continua público onde tem função: o checkout mostra valor por item
// e total antes de cobrar. O que saiu foi a VITRINE de preço, não o preço.
// =============================================================================

const PAGINA = 'src/app/produtos/page.tsx';
const fonte = readFileSync(resolve(process.cwd(), PAGINA), 'utf-8');

describe('a página de catálogo não é uma lista de preço', () => {
  it('a tabela não tem coluna de preço', () => {
    expect(fonte).not.toMatch(/Preço\s*<span/);
    expect(fonte).not.toContain('(compra direta)');
  });

  it('e não renderiza valor de modelo nenhum', () => {
    // `formatBRL` é o formatador de preço do catálogo. Se ele voltar a esta
    // página, voltou preço — e aí o `offers` tem que voltar junto, senão o
    // schema passa a mentir por omissão.
    expect(fonte).not.toContain('formatBRL');
    expect(fonte).not.toMatch(/m\.preco/);
  });

  it('⛔ nenhum preço digitado à mão escapou no lugar da coluna', () => {
    expect(fonte).not.toMatch(/R\$\s?\d/);
  });
});

describe('🔴 o schema não anuncia preço que a página não mostra', () => {
  it.each([
    ['catálogo (/produtos)', masterBlockProductSchema()],
    ['NI (/protecao-residencial)', masterBlockProdutoNiSchema('/protecao-residencial')],
  ])('%s não declara offers', (_nome, schema) => {
    expect(schema).not.toHaveProperty('offers');
  });

  it('nem qualquer outro campo de preço', () => {
    for (const s of [masterBlockProductSchema(), masterBlockProdutoNiSchema('/x')]) {
      const texto = JSON.stringify(s);
      expect(texto).not.toContain('AggregateOffer');
      expect(texto).not.toContain('lowPrice');
      expect(texto).not.toContain('priceCurrency');
    }
  });
});

describe('o catálogo em si continua íntegro — o preço só saiu da VITRINE', () => {
  it('os 12 modelos seguem com preço na fonte, que é o que o checkout cobra', () => {
    // Tirar o preço da página não pode virar tirar o preço do sistema. Quem
    // compra vê o valor no checkout, e é daqui que ele sai.
    expect(MASTER_BLOCK_MODELS).toHaveLength(12);
    for (const m of MASTER_BLOCK_MODELS) {
      expect(m.preco, `${m.model} sem preço`).toBeGreaterThan(0);
    }
  });

  it('e a tabela continua mostrando o que a página VENDE: desempenho', () => {
    // O motivo da remoção não era "menos informação", era "a informação certa".
    // Se estas colunas sumirem, a página deixou de fazer o que o Léo pediu.
    for (const coluna of ['Modelo', 'Corrente de carga', 'ICC', 'Dimensões', 'Peso']) {
      expect(fonte, `a tabela perdeu a coluna ${coluna}`).toContain(coluna);
    }
  });
});
