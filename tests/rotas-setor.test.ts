import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { INDUSTRIAS, getIndustria } from '@/lib/constants/industrias';

// =============================================================================
// AS 4 PÁGINAS DE SETOR ESTAVAM 404 EM PRODUÇÃO — e o sitemap as anunciava.
//
// Achado em 13/09 varrendo as 25 rotas no ar. O quadro era contraditório:
//
//   sitemap.xml em produção   → lista as quatro
//   log de build do Railway   → lista as quatro como prerenderizadas
//   `next start` local, MESMO commit → 200 nas quatro
//   produção (domínio E host do Railway) → 404, com x-nextjs-prerender: 1
//
// O log do servidor fechou a conta:
//
//     Error: Internal: NoFallbackError
//         at responseGenerator (.next/server/app/industrias/[setor]/page.js)
//
// `dynamicParams = false` diz "só existe o que o build gerou". `revalidate` diz
// "regenere de tempos em tempos". Quando a entrada de cache some — expira, é
// despejada, ou é invalidada por TAG (a página carrega `site_settings`,
// `footer` e `whatsapp_button` do layout) — o Next tenta regenerar, não encontra
// fallback, e devolve 404 seco.
//
// ⚠️ Não reproduz em `next start` local: ali o cache nasce com o build e nunca
// esvazia. Só um servidor de verdade, que reinicia e recebe invalidação, mostra.
//
// A intenção de `dynamicParams = false` (slug inventado → 404 real, não página
// fina indexável) já era garantida pelo `notFound()` do corpo. O que quebrou foi
// só a parte redundante.
// =============================================================================

const PAGINA = 'src/app/industrias/[setor]/page.tsx';

/** Lê o arquivo SEM comentários.
 *
 *  ⚠️ Sem isto a guarda acusa a PRÓPRIA EXPLICAÇÃO: o comentário no topo da
 *  página cita `dynamicParams = false` seis vezes pra contar por que ele saiu,
 *  e o teste reprovava o arquivo consertado. Levei a mutação inteira pra
 *  descobrir — a primeira rodada já vinha vermelha, antes de eu mexer em nada.
 *
 *  Mesma armadilha que o `copy-guards.test.ts` documenta: guarda que procura
 *  texto tem que ler CÓDIGO, não prosa. Linha primeiro, bloco depois. */
function lerCodigo(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf-8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

const fonte = lerCodigo(PAGINA);

describe('⛔ dynamicParams = false não volta pra esta rota', () => {
  it('a rota de setor NÃO declara dynamicParams = false', () => {
    // Voltar a declarar reabre o 404 exatamente do mesmo jeito: silencioso,
    // invisível em build e em teste, e visível só depois que o cache gira.
    expect(fonte).not.toMatch(/dynamicParams\s*=\s*false/);
  });

  it('e o 404 de slug inventado continua garantido pelo notFound()', () => {
    // É isto que substitui o dynamicParams. Se sumir, slug qualquer passa a
    // renderizar página quebrada em vez de 404 — pior pro SEO que o problema
    // que a gente acabou de consertar.
    expect(fonte).toContain('notFound()');
    expect(fonte).toMatch(/if\s*\(\s*!ind\s*\)\s*notFound\(\)/);
  });

  it('slug inventado não resolve — a função devolve undefined', () => {
    expect(getIndustria('nao-existe')).toBeUndefined();
    expect(getIndustria('')).toBeUndefined();
  });
});

describe('o sitemap não anuncia URL que não existe', () => {
  const sitemap = readFileSync(resolve(process.cwd(), 'src/app/sitemap.ts'), 'utf-8');

  it.each(INDUSTRIAS.map((i) => i.slug))('/industrias/%s está no sitemap', (slug) => {
    expect(sitemap).toContain(`/industrias/${slug}`);
  });

  it('⚠️ e o sitemap não lista setor que o catálogo não tem', () => {
    // O contrário do teste acima, e o que de fato aconteceu: o sitemap
    // prometendo o que a rota não entrega. Aqui a promessa e a fonte são a
    // mesma lista.
    const noSitemap = [...sitemap.matchAll(/\/industrias\/([a-z-]+)/g)].map((m) => m[1]);
    const doCatalogo = new Set(INDUSTRIAS.map((i) => i.slug));
    for (const s of noSitemap) {
      expect(doCatalogo.has(s), `sitemap anuncia /industrias/${s}, que não existe em INDUSTRIAS`).toBe(true);
    }
  });
});

describe('varredura: nenhuma outra rota dinâmica caiu na mesma armadilha', () => {
  function rotas(dir: string): string[] {
    const achados: string[] = [];
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) achados.push(...rotas(caminho));
      else if (nome === 'page.tsx' || nome === 'route.ts') achados.push(caminho);
    }
    return achados;
  }

  it('dynamicParams = false + revalidate não convivem em nenhuma rota', () => {
    const problemas = rotas(resolve(process.cwd(), 'src/app'))
      .map((p) => ({ p: relative(process.cwd(), p), s: lerCodigo(relative(process.cwd(), p)) }))
      .filter(({ s }) => /dynamicParams\s*=\s*false/.test(s) && /export const revalidate/.test(s))
      .map(({ p }) => p);

    expect(problemas, `o par derruba a rota quando o cache gira: ${problemas.join(', ')}`).toEqual(
      [],
    );
  });
});
