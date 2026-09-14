import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import config from '../tailwind.config';

// =============================================================================
// CONTRASTE DE TEXTO — B-contraste da auditoria 13/09, e a armadilha que ela
// quase deixou passar.
//
// O ciano institucional (#008CC8) dá 3,76:1 no branco: reprova os 4,5:1 que a
// WCAG pede para texto normal, e era o que derrubava a nota de acessibilidade
// da home, do blog e do orçamento. A correção foi um tom só para TEXTO em
// fundo claro (`text-cyan-text`), aplicado em 16 arquivos.
//
// ⚠️ O QUE ESTA GUARDA EXISTE PRA PEGAR: a primeira tentativa trocou as 16
// chamadas e NÃO gravou o token no `tailwind.config.ts`. `text-cyan-text`
// virou classe inexistente — o texto passou a herdar a cor do pai, o
// Lighthouse deu 100 (herdou escuro, contraste sobrando) e o ciano tinha
// sumido da tela sem nada acusar. Nota boa por motivo errado é pior que nota
// ruim: ela encerra a investigação.
// =============================================================================

/** Luminância relativa (WCAG 2.x) de um hex `#RRGGBB`. */
function luminancia(hex: string): number {
  const canais = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

function contraste(a: string, b: string): number {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const BRANCO = '#FFFFFF';
/** `off_white` do próprio tema — é o fundo das seções claras do site. */
const OFF_WHITE = '#F1F5F9';
/** `bg-cyan/10` sobre o off-white: o fundo das tarjas de categoria. Entra na
 *  conta porque parar no primeiro tom que passa no BRANCO deixou a tarja do
 *  artigo em 4,43:1 — reprovada por três centésimos. */
const TARJA_CIANO = '#D9EBF4';

type Cores = Record<string, Record<string, string> | string>;
const cores = (config.theme?.extend?.colors ?? {}) as Cores;
const ciano = cores.cyan as Record<string, string> | undefined;

describe('token de ciano para texto', () => {
  it('existe no tema (classe sem token vira cor herdada, em silêncio)', () => {
    expect(ciano, 'tailwind.config.ts não declara a paleta cyan').toBeDefined();
    expect(
      ciano?.text,
      'cyan.text sumiu do tailwind.config.ts — `text-cyan-text` não pinta nada',
    ).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('passa os 4,5:1 da WCAG nos dois fundos claros do site', () => {
    const cor = ciano!.text;
    expect(Number(contraste(cor, BRANCO).toFixed(2))).toBeGreaterThanOrEqual(4.5);
    expect(Number(contraste(cor, OFF_WHITE).toFixed(2))).toBeGreaterThanOrEqual(4.5);
    expect(Number(contraste(cor, TARJA_CIANO).toFixed(2))).toBeGreaterThanOrEqual(4.5);
  });

  it('branco sobre o ciano de TEXTO passa — é o fundo dos chips selecionados', () => {
    // `bg-cyan text-white` dava 3,75:1 no filtro do blog e no quiz de VTCD.
    expect(Number(contraste(BRANCO, ciano!.text).toFixed(2))).toBeGreaterThanOrEqual(4.5);
    // E o de marca segue reprovando: é por isso que os dois trocaram de tom.
    expect(Number(contraste(BRANCO, ciano!.DEFAULT).toFixed(2))).toBeLessThan(4.5);
  });

  it('o ciano de MARCA continua sendo o da marca (não se conserta escurecendo tudo)', () => {
    // Preenchimento, borda, ícone e título grande não têm o piso de 4,5:1.
    // Mudar o DEFAULT pra "resolver contraste" repintaria o site inteiro.
    expect(ciano?.DEFAULT?.toUpperCase()).toBe('#008CC8');
  });
});

function arquivos(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivos(caminho, out);
    else if (/\.(ts|tsx|css)$/.test(nome)) out.push(caminho);
  }
  return out;
}

describe('classes de cor usadas existem no tema', () => {
  it('toda variante `*-cyan-<nome>` usada no código tem token', () => {
    const declarados = new Set(Object.keys(ciano ?? {}).map((k) => k.toLowerCase()));
    const orfas: string[] = [];

    for (const arquivo of arquivos(resolve(process.cwd(), 'src'))) {
      const fonte = readFileSync(arquivo, 'utf8');
      for (const m of fonte.matchAll(/\b(?:text|bg|border|ring|fill|stroke)-cyan-([a-z]+)\b/g)) {
        if (!declarados.has(m[1])) orfas.push(`${m[0]} (${relative(process.cwd(), arquivo)})`);
      }
    }

    expect(
      [...new Set(orfas)],
      `classe sem token no tailwind.config.ts — não pinta nada e não avisa: ${orfas.join(', ')}`,
    ).toEqual([]);
  });
});
