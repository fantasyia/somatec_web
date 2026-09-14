import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { EMPRESA, anosDeAtuacao } from '@/lib/constants/site';

// =============================================================================
// B18 — O SITE DIZIA DUAS DATAS DE FUNDAÇÃO AO MESMO TEMPO.
//
// O ano estava digitado solto em 6 arquivos. Cinco diziam 1999 (institucional,
// quem-somos, `foundingDate` do JSON-LD) e o MENU dizia 1998. Nada acusava,
// porque cada arquivo estava internamente coerente — só o conjunto é que
// mentia, e o `foundingDate` vai pro Google e pras buscas de IA.
//
// Fonte da verdade: `clients/somatec/brand/kit-perfis-digitais.md`, da master.
// =============================================================================

const RAIZ = resolve(process.cwd(), 'src');
const FONTE_DA_VERDADE = 1999;

function arquivos(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivos(caminho, out);
    else if (/\.(ts|tsx)$/.test(nome)) out.push(caminho);
  }
  return out;
}

describe('ano de fundação', () => {
  it('a constante bate com a base da marca', () => {
    expect(EMPRESA.fundacao).toBe(FONTE_DA_VERDADE);
  });

  it('nenhum arquivo cita um ano de fundação diferente', () => {
    const errados: string[] = [];
    for (const arquivo of arquivos(RAIZ)) {
      const fonte = readFileSync(arquivo, 'utf8');
      fonte.split('\n').forEach((linha, i) => {
        // Só interessa ano perto de palavra de fundação/história, pra não
        // pegar CNPJ, telefone nem número de norma.
        if (!/fundad|fundação|desde|autoridade em/i.test(linha)) return;
        for (const m of linha.matchAll(/\b(19|20)\d{2}\b/g)) {
          const ano = Number(m[0]);
          // O comentário da própria constante cita o 1998 como história.
          if (linha.includes('*')) continue;
          if (ano !== FONTE_DA_VERDADE) {
            errados.push(`${relative(process.cwd(), arquivo)}:${i + 1} → ${ano}`);
          }
        }
      });
    }
    expect(
      [...new Set(errados)],
      `ano de fundação divergente da base da marca (${FONTE_DA_VERDADE}): ${errados.join(', ')}`,
    ).toEqual([]);
  });

  it('o JSON-LD publica o mesmo ano', () => {
    const sd = readFileSync(resolve(RAIZ, 'lib/seo/structured-data.ts'), 'utf8');
    expect(sd).toContain(`foundingDate: '${FONTE_DA_VERDADE}'`);
  });
});

// =============================================================================
// ANOS DE ATUAÇÃO — o número que envelhece sozinho.
//
// Estava na mão em 12 pontos (páginas, FAQ, llms.txt, selos de prova,
// checkout). No aniversário, o site inteiro passaria a dizer um ano a menos do
// que a empresa tem, em 12 lugares, sem ninguém ser avisado.
//
// 🔒 A conta é CONSERVADORA: o Léo confirmou o último trimestre de 1999 e não o
// mês, então ela assume 31/12. A frase que acompanha o número é "sem nenhum
// acidente" — inflar o tempo infla o histórico de segurança junto.
// =============================================================================

describe('anos de atuação', () => {
  it('em setembro de 2026 diz 26, que é o que está escrito hoje', () => {
    expect(anosDeAtuacao(new Date('2026-09-14T12:00:00Z'))).toBe(26);
  });

  it('vira 27 sozinho na virada, sem ninguém editar nada', () => {
    expect(anosDeAtuacao(new Date('2026-12-30T12:00:00Z'))).toBe(26);
    expect(anosDeAtuacao(new Date('2026-12-31T12:00:00Z'))).toBe(27);
    expect(anosDeAtuacao(new Date('2027-06-01T12:00:00Z'))).toBe(27);
  });

  it('nunca diz mais anos do que a empresa tem', () => {
    // Se a fundação foi em outubro, em novembro de 2026 já seriam 27 e o site
    // dirá 26. Errar pra menos é a direção escolhida de propósito.
    for (const iso of ['2026-10-15', '2026-11-20', '2026-12-30']) {
      expect(anosDeAtuacao(new Date(`${iso}T12:00:00Z`))).toBeLessThanOrEqual(
        2026 - EMPRESA.fundacao,
      );
    }
  });

  it('nenhum arquivo do site digita mais o número na mão', () => {
    const errados: string[] = [];
    for (const arquivo of arquivos(RAIZ)) {
      // A própria constante cita o número no comentário que explica a decisão.
      if (arquivo.endsWith(join('constants', 'site.ts'))) continue;
      const fonte = readFileSync(arquivo, 'utf8');
      fonte.split('\n').forEach((linha, i) => {
        if (/\b2[0-9] anos\b/.test(linha) && !linha.trim().startsWith('*')) {
          errados.push(`${relative(process.cwd(), arquivo)}:${i + 1}`);
        }
      });
    }
    expect(
      [...new Set(errados)],
      `anos de atuação digitado na mão — use anosDeAtuacao(): ${errados.join(', ')}`,
    ).toEqual([]);
  });
});
