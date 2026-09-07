import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// @ts-expect-error — módulo .mjs compartilhado com o script de varredura
import { APOSENTADO, APOSENTADO_SLUG, PERMITIDO } from '../scripts/vocabulario-aposentado.mjs';

// =============================================================================
// A LISTA DE VOCABULÁRIO APOSENTADO NÃO PODE SER ESVAZIADA.
//
// A varredura do banco (`npm run varredura:banco`) é um script, não um teste do
// vitest — de propósito: teste que depende de rede e credencial ou quebra o
// build de quem não tem acesso, ou "passa" pulando em silêncio, que é a falha
// que este projeto já pagou caro.
//
// O preço disso é que ninguém percebe se a lista for esvaziada: o script
// continua rodando e dando verde sobre nada. Estes testes são o contrapeso.
//
// Contexto: em 07/09 o script achou 58 ocorrências em 16 posts do banco. Os
// `.md` do repo do blog tinham sido corrigidos; o que já estava carregado no
// CMS, não — e nenhuma guarda alcançava conteúdo de banco.
// =============================================================================

type Padrao = { re: RegExp; morreu: string; porque: string };

const TODOS = [...(APOSENTADO as Padrao[]), ...(APOSENTADO_SLUG as Padrao[])];

describe('vocabulário aposentado — a lista existe e cobre as 4 mortes', () => {
  it('nenhuma das listas está vazia', () => {
    expect((APOSENTADO as Padrao[]).length).toBeGreaterThan(10);
    expect((APOSENTADO_SLUG as Padrao[]).length).toBeGreaterThan(2);
  });

  it('todo padrão diz QUANDO morreu e POR QUÊ', () => {
    // Sem a data, ninguém sabe se a regra ainda vale — e foi assim que a
    // oferta de 03/09 sobreviveu em arquivo até 07/09.
    for (const p of TODOS) {
      expect(p.morreu, `padrão ${p.re} sem data`).toMatch(/^\d{2}\/\d{2}$/);
      expect(p.porque, `padrão ${p.re} sem motivo`).toBeTruthy();
    }
  });

  it('cobre as 4 mecânicas que morreram', () => {
    const casos: Array<[string, string]> = [
      ['a Somatec faz uma medição gratuita na sua planta', '20/08'],
      ['avaliação de 60 a 90 dias na sua fábrica', '03/09'],
      ['você só paga se o resultado for comprovado', '03/09'],
      ['não paga nada até a instalação', '04/09'],
      ['a instalação sem custo fica por nossa conta', '04/09'],
      ['você encerra quando quiser', '04/09'],
    ];
    for (const [frase, morte] of casos) {
      const bate = (APOSENTADO as Padrao[]).filter((p) => p.re.test(frase));
      expect(bate.length, `"${frase}" deixou de ser pega`).toBeGreaterThan(0);
      expect(bate.map((p) => p.morreu), `"${frase}" com a data errada`).toContain(morte);
    }
  });

  it('o slug é vigiado por padrão PRÓPRIO — hífen come as palavras de ligação', () => {
    // "periodo-avaliacao-60-90-dias" não casa com /período de avaliação/ nem
    // com /60 a 90 dias/: faltam o "de" e o "a". A checagem de slug reusando a
    // lista normal era decorativa, e um post inteiro escapou por isso.
    for (const slug of [
      'software-master-block-periodo-avaliacao-60-90-dias',
      'antes-chamar-somatec-avaliacao-60-90-dias-levantar',
    ]) {
      expect(
        (APOSENTADO_SLUG as Padrao[]).some((p) => p.re.test(slug)),
        `slug "${slug}" passaria batido`,
      ).toBe(true);
      // e confirma que a lista normal NÃO pegaria — é por isso que a outra existe
      expect((APOSENTADO as Padrao[]).some((p) => p.re.test(slug))).toBe(false);
    }
  });
});

describe('a guarda não pode ser larga a ponto de apagar argumento bom', () => {
  it('nenhuma frase legítima é reprovada', () => {
    // Guarda larga demais apaga a medição pós-instalação, que é prova de venda.
    for (const frase of PERMITIDO as string[]) {
      const bate = TODOS.filter((p) => p.re.test(frase));
      expect(bate.map((p) => String(p.re)), `"${frase}" foi reprovada`).toHaveLength(0);
    }
  });
});

describe('a lista acompanha a fonte da verdade', () => {
  const oferta = readFileSync(
    resolve(process.cwd(), 'src/lib/constants/oferta-industrial.ts'),
    'utf-8',
  );

  it('todo termo que oferta-industrial.ts declara aposentado é vigiado', () => {
    // O cabeçalho daquele arquivo lista o vocabulário morto com a data. Se
    // alguém acrescentar um termo lá e esquecer aqui, a varredura do banco
    // fica cega pra ele — que é exatamente como isto começou.
    // Par [fragmento como aparece no arquivo, frase inteira como sai na tela].
    // Os dois lados importam e são diferentes: alguns padrões exigem contexto
    // de propósito — /só paga … comprovad/ pede o "comprovado" junto pra não
    // reprovar um "só paga" inocente. Testar só o fragmento acusaria falso.
    const termos: Array<[string, string]> = [
      ['período de avaliação', 'houve um período de avaliação de verdade'],
      ['60 a 90 dias', 'avaliação de 60 a 90 dias na planta'],
      ['só paga se o resultado', 'você só paga se o resultado for comprovado'],
      ['zero risco', 'é zero risco pra você'],
      ['não paga nada até', 'não paga nada até a instalação'],
      ['instalação sem custo', 'instalação sem custo pela Somatec'],
      ['quando quiser', 'você encerra quando quiser'],
    ];
    for (const [fragmento, frase] of termos) {
      expect(
        oferta.toLowerCase().replace(/\s+/g, ' '),
        `oferta-industrial.ts não cita "${fragmento}"`,
      ).toContain(fragmento.toLowerCase());
      expect(
        TODOS.some((p) => p.re.test(frase)),
        `"${frase}" está no arquivo da oferta mas não na lista da varredura`,
      ).toBe(true);
    }
  });
});
