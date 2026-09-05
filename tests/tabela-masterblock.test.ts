import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MASTER_BLOCK_MODELS, selecionarMasterBlock } from '@/lib/constants/masterblock';
import * as masterblock from '@/lib/constants/masterblock';

// =============================================================================
// A TABELA DE MODELOS É O PREÇO QUE O CLIENTE PAGA — e o modelo que ele leva.
//
// A tabela de 27/07 ficou no ar por mais de um mês depois de o app ter sido
// atualizado (03–04/09) com a tabela oficial de 2026. Resultado: os 12 preços
// errados (MB-01 saindo R$ 1.200 abaixo, MB-08 R$ 4.300 acima), e — pior — a
// CORRENTE errada, que de 751 A pra cima escolhia modelo MENOR que o
// necessário. Subdimensionar é vender algo que não protege; o erro só aparece
// quando o equipamento queima.
//
// O preço daqui vai direto pro pedido e pro ERP, sem conferência no meio. Por
// isso a tabela fica TRAVADA aqui, linha a linha: quem mudar a constante sem
// mudar este teste é avisado; quem mudar os dois está mudando de propósito.
//
// Fonte: tabela oficial de venda 2026 (PDF de 31/08), que bate 12/12 com
// `Produto.precoTabela` no app. "A tabela do app é a que vale" (Léo, 05/09).
// =============================================================================

const TABELA_2026: readonly [string, string, number, string, number][] = [
  // modelo · faixa · loadMax · ICC · preço
  ['MB-01', '1 – 150 A', 150, '32 kA', 4350],
  ['MB-02', '150 – 250 A', 250, '40 kA', 5675],
  ['MB-03', '251 – 400 A', 400, '48 kA', 6930],
  ['MB-04', '401 – 550 A', 550, '48 kA', 8290],
  // MB-05: o PDF trazia 501, sobrepondo o MB-04. Léo confirmou 551 (05/09).
  ['MB-05', '551 – 650 A', 650, '56 kA', 9220],
  ['MB-06', '651 – 750 A', 750, '64 kA', 11125],
  ['MB-07', '751 – 850 A', 850, '72 kA', 14625],
  ['MB-08', '851 – 950 A', 950, '80 kA', 19550],
  ['MB-09', '951 – 1200 A', 1200, '88 kA', 26900],
  ['MB-10', '1201 – 2000 A', 2000, '96 kA', 41350],
  ['MB-11', '2001 – 3000 A', 3000, '100 kA', 65825],
  ['MB-12', '+ de 3000 A', Number.POSITIVE_INFINITY, '100 kA', 83750],
];

describe('os 12 modelos batem com a tabela oficial de 2026', () => {
  it('são exatamente 12, na ordem', () => {
    expect(MASTER_BLOCK_MODELS.map((m) => m.model)).toEqual(TABELA_2026.map((l) => l[0]));
  });

  it.each(TABELA_2026)('%s · %s · até %s A · ICC %s · R$ %d', (model, loadLabel, loadMax, icc, preco) => {
    const m = MASTER_BLOCK_MODELS.find((x) => x.model === model)!;
    expect(m, `${model} sumiu da tabela`).toBeDefined();
    expect(m.loadLabel).toBe(loadLabel);
    expect(m.loadMax).toBe(loadMax);
    expect(m.icc).toBe(icc);
    expect(m.preco).toBe(preco);
  });

  it('⛔ os preços de 27/07 não voltam', () => {
    // Os que mais custavam: MB-01 (modelo do não-industrial) e MB-08.
    const precos = MASTER_BLOCK_MODELS.map((m) => m.preco);
    for (const velho of [3150, 4120, 5250, 7040, 23850, 36620, 55760, 83930]) {
      expect(precos, `preço de 27/07 (${velho}) voltou`).not.toContain(velho);
    }
  });

  it('⛔ surge e nominal saíram — não constam em documento nenhum', () => {
    // Léo (05/09): "coloque no site só o ICC". A progressão 8/16/24… kA era
    // aritmética demais pra ser medida, e ninguém sabia de onde vinha.
    for (const m of MASTER_BLOCK_MODELS) {
      expect(m).not.toHaveProperty('surge');
      expect(m).not.toHaveProperty('nominal');
      expect(m.icc, `${m.model} sem ICC`).toMatch(/^\d+ kA$/);
    }
  });
});

// =============================================================================
// A SELEÇÃO — é ela que decide qual modelo o cliente leva.
//
// Cada caso abaixo é uma linha da tabela "site escolhe × tabela manda" do
// card. Os marcados 🔴 eram os que SUBDIMENSIONAVAM.
// =============================================================================

describe('selecionarMasterBlock escolhe pela faixa oficial', () => {
  it.each([
    [1, 'MB-01'],
    [125, 'MB-01'],
    [126, 'MB-01'], // site escolhia MB-02 (superdimensionava)
    [150, 'MB-01'],
    [151, 'MB-02'],
    [250, 'MB-02'],
    [400, 'MB-03'],
    [550, 'MB-04'], // site escolhia MB-05
    [551, 'MB-05'],
    [650, 'MB-05'], // site escolhia MB-06
    [750, 'MB-06'],
    [800, 'MB-07'], // 🔴 site escolhia MB-06
    [850, 'MB-07'],
    [950, 'MB-08'], // 🔴 site escolhia MB-07
    [1000, 'MB-09'], // 🔴 site escolhia MB-07 — 2 degraus abaixo
    [1200, 'MB-09'], // 🔴 site escolhia MB-08
    [1250, 'MB-10'], // 🔴 site escolhia MB-08 — 2 degraus abaixo
    [1600, 'MB-10'], // 🔴 site escolhia MB-09
    [2000, 'MB-10'],
    [2500, 'MB-11'], // 🔴 site escolhia MB-10
    [3000, 'MB-11'],
    [3001, 'MB-12'],
    [3200, 'MB-12'], // 🔴 site escolhia MB-11
  ] as const)('%d A → %s', (amp, model) => {
    expect(selecionarMasterBlock(amp)?.model).toBe(model);
  });

  it('⛔ NÃO existe teto: acima de 3000 A é MB-12, nunca null', () => {
    // O MB_LOAD_MAX = 6300 era invenção e fazia o site RECUSAR a corrente —
    // perdia o lead. "+ de 3000 A" não tem limite.
    for (const amp of [4000, 6300, 6301, 7000, 20000, 99999]) {
      expect(selecionarMasterBlock(amp)?.model, `${amp} A`).toBe('MB-12');
    }
  });

  it('a constante do teto não existe mais', () => {
    expect((masterblock as Record<string, unknown>).MB_LOAD_MAX).toBeUndefined();
  });

  it('só recusa o que não é corrente', () => {
    for (const ruim of [0, -1, NaN, Infinity]) {
      expect(selecionarMasterBlock(ruim), String(ruim)).toBeNull();
    }
  });

  it('as faixas cobrem tudo sem buraco nem sobreposição', () => {
    // Cada loadMax tem de ser maior que o anterior; sem isso, uma corrente
    // cairia em dois modelos (ou em nenhum) — que foi o problema do MB-05.
    const tetos = MASTER_BLOCK_MODELS.map((m) => m.loadMax);
    for (let i = 1; i < tetos.length; i++) {
      expect(tetos[i], `${MASTER_BLOCK_MODELS[i].model} ≤ ${MASTER_BLOCK_MODELS[i - 1].model}`).toBeGreaterThan(tetos[i - 1]);
    }
  });
});

// =============================================================================
// A TELA — /produtos mostra ICC, não as colunas sem fonte.
// =============================================================================

describe('/produtos publica só a spec elétrica que tem fonte', () => {
  const FONTE = readFileSync(resolve(process.cwd(), 'src/app/produtos/page.tsx'), 'utf-8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('exibe a coluna ICC', () => {
    expect(FONTE).toMatch(/\{m\.icc\}/);
    expect(FONTE).toMatch(/ICC/);
  });

  it('⛔ não exibe surge nem nominal', () => {
    expect(FONTE).not.toMatch(/\{m\.surge\}/);
    expect(FONTE).not.toMatch(/\{m\.nominal\}/);
    expect(FONTE).not.toMatch(/corrente de surto/i);
    expect(FONTE).not.toMatch(/Corrente nominal/);
  });

  it('a varredura está lendo o arquivo certo (âncora anti-falso-verde)', () => {
    expect(FONTE).toContain('MASTER_BLOCK_MODELS');
    expect(FONTE).toContain('{m.loadLabel}');
  });
});
