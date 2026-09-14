import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// M25 DA AUDITORIA 13/09 — O ÍNDICE PRA IA E O ÍNDICE PRO GOOGLE DIVERGIAM.
//
// `sitemap.xml` e `llms.txt` são a mesma lista escrita duas vezes à mão, em
// arquivos diferentes, por motivos diferentes. Página nova entra num e esquece
// o outro, e a falha é MUDA: os dois continuam válidos, servindo, com status
// 200 — só que um deles não conhece a página.
//
// Foi exatamente assim que `/blog` ficou fora do llms.txt: a linha dele vivia
// dentro do bloco de artigos, que só é montado quando existe artigo publicado.
// Sem o primeiro artigo, o índice do blog não era anunciado a IA nenhuma, e
// nada acusava.
//
// A guarda compara as duas listas pela FONTE, não por uma terceira lista
// escrita à mão — lista manual é varredura que decide de antemão o que não vai
// encontrar.
// =============================================================================

function fonte(caminho: string): string {
  return readFileSync(resolve(process.cwd(), caminho), 'utf8');
}

/** Rotas estáticas do sitemap: as linhas `${base}/alguma-coisa`. */
function rotasDoSitemap(): string[] {
  const src = fonte('src/app/sitemap.ts');
  const bloco = src.slice(src.indexOf('staticEntries'), src.indexOf('blogEntries'));
  const achadas = [...bloco.matchAll(/\$\{base\}(\/[a-z0-9/-]*)/g)].map((m) => m[1]);
  return [...new Set(achadas)].sort();
}

/** Caminhos declarados no llms.txt (`href: '/...'`). */
function rotasDoLlms(): string[] {
  const src = fonte('src/app/llms.txt/route.ts');
  const achadas = [...src.matchAll(/href:\s*'(\/[a-z0-9/-]*)'/g)].map((m) => m[1]);
  return [...new Set(achadas)].sort();
}

/** Rota que está num índice e não no outro DE PROPÓSITO. Cada linha precisa de
 *  motivo — a lista existe pra ser lida, não pra silenciar a guarda. */
const FORA_DO_LLMS: Record<string, string> = {
  // nenhuma hoje
};

describe('llms.txt cobre o mesmo site que o sitemap', () => {
  const sitemap = rotasDoSitemap();
  const llms = rotasDoLlms();

  it('as duas varreduras acham rota (não passam por estarem vazias)', () => {
    expect(sitemap.length).toBeGreaterThan(15);
    expect(llms.length).toBeGreaterThan(15);
  });

  it('toda rota do sitemap está anunciada no llms.txt', () => {
    const faltando = sitemap.filter((r) => !llms.includes(r) && !(r in FORA_DO_LLMS));
    expect(
      faltando,
      `no sitemap e ausente do llms.txt: ${faltando.join(', ')}`,
    ).toEqual([]);
  });

  it('o llms.txt não anuncia rota que o sitemap não conhece', () => {
    // O outro lado do mesmo risco: página tirada do ar sai do sitemap e
    // continua sendo oferecida pra IA, que cita uma URL morta.
    const sobrando = llms.filter((r) => !sitemap.includes(r));
    expect(
      sobrando,
      `anunciada no llms.txt e fora do sitemap: ${sobrando.join(', ')}`,
    ).toEqual([]);
  });

  it('o índice do blog é anunciado mesmo sem artigo publicado', () => {
    // A linha tem de viver na lista fixa; dentro do bloco de artigos ela
    // desaparece junto com eles.
    const src = fonte('src/app/llms.txt/route.ts');
    const listaFixa = src.slice(0, src.indexOf('export async function GET'));
    expect(listaFixa).toContain("href: '/blog'");
  });
});

describe('llms.txt não promete o que a página não tem', () => {
  it('não anuncia preço em /produtos', () => {
    // `/produtos` não renderiza preço em lugar nenhum — nenhum componente lê
    // `preco` de MASTER_BLOCK_MODELS. Num arquivo cujo leitor é uma IA,
    // prometer um dado ausente é convite pra ela inventar o número.
    const src = fonte('src/app/llms.txt/route.ts');
    const linhaProdutos = src
      .split('\n')
      .find((l) => l.includes("href: '/produtos'"));
    expect(linhaProdutos).toBeDefined();
    expect(linhaProdutos!.toLowerCase()).not.toMatch(/pre[çc]o/);
  });

  it('a página /produtos realmente não mostra preço (se mudar, a linha acima volta)', () => {
    const pagina = fonte('src/app/produtos/page.tsx');
    expect(pagina).not.toMatch(/\.preco\b/);
  });
});
