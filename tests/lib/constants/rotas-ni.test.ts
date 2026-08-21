import { describe, it, expect } from 'vitest';
import { ehRotaNi, semIndustriaisSeNi, DESTINOS_INDUSTRIAIS } from '@/lib/constants/rotas-ni';
import { getBlogPosts } from '@/lib/constants/blog';
import { publicoDoCluster } from '@/lib/constants/publico-clusters';
import { HEADER_NAV, FOOTER_COLUMNS } from '@/lib/constants/navigation';

// =============================================================================
// Menu e rodapé aparecem em TODA página. Enquanto o corpo das LPs já era
// segmentado, essas duas superfícies globais seguiam servindo ferramenta
// industrial (custo de parada, projeto da planta) pra quem lê sobre a casa ou a
// padaria. Decisão do Léo (21/08): esconder nas rotas NI.
// =============================================================================

describe('ehRotaNi', () => {
  it('as duas LPs de compra direta são NI', () => {
    expect(ehRotaNi('/protecao-residencial')).toBe(true);
    expect(ehRotaNi('/protecao-comercial')).toBe(true);
  });

  it.each(['/', '/produtos', '/resultados', '/orcamento-industrial', '/ferramentas/custo-de-parada', '/contato'])(
    '%s não é NI',
    (rota) => {
      expect(ehRotaNi(rota)).toBe(false);
    },
  );

  it('artigo de casa/comércio é NI; artigo industrial não é', () => {
    const posts = getBlogPosts();
    const ni = posts.find((p) => publicoDoCluster(p.cluster) !== null);
    const ind = posts.find((p) => publicoDoCluster(p.cluster) === null);
    expect(ni, 'precisa existir ao menos 1 artigo NI pra este teste valer').toBeDefined();
    expect(ind, 'precisa existir ao menos 1 artigo industrial').toBeDefined();
    expect(ehRotaNi(`/blog/${ni!.slug}`)).toBe(true);
    expect(ehRotaNi(`/blog/${ind!.slug}`)).toBe(false);
  });

  it('a lista de artigos NI sai do CLUSTER, não de lista paralela', () => {
    // Se alguém publicar artigo NI novo, ele entra sozinho — sem segunda lista
    // pra esquecerem de atualizar. Aqui a checagem é de cobertura total.
    for (const p of getBlogPosts()) {
      const esperado = publicoDoCluster(p.cluster) !== null;
      expect(ehRotaNi(`/blog/${p.slug}`), `${p.slug} (cluster ${p.cluster})`).toBe(esperado);
    }
  });

  it('pathname nulo não quebra (primeiro render)', () => {
    expect(ehRotaNi(null)).toBe(false);
  });
});

describe('semIndustriaisSeNi', () => {
  const itens = [
    { href: '/contato' },
    { href: '/ferramentas/custo-de-parada' },
    { href: '/orcamento-industrial' },
  ];

  it('em rota NI, tira só os destinos industriais', () => {
    expect(semIndustriaisSeNi(itens, '/protecao-residencial')).toEqual([{ href: '/contato' }]);
  });

  it('fora de rota NI, devolve tudo intacto', () => {
    expect(semIndustriaisSeNi(itens, '/produtos')).toEqual(itens);
  });
});

describe('o filtro cobre o que realmente existe no menu e no rodapé', () => {
  // Âncora anti-falso-verde: se um href mudar (ex.: a ferramenta ganhar outro
  // caminho), o filtro pararia de casar e nada acusaria.
  it('todo destino industrial da lista existe no menu ou no rodapé', () => {
    const hrefs = new Set<string>();
    for (const item of HEADER_NAV) {
      hrefs.add(item.href);
      item.children?.forEach((c) => hrefs.add(c.href));
    }
    for (const col of FOOTER_COLUMNS) col.links.forEach((l) => hrefs.add(l.href));

    for (const destino of DESTINOS_INDUSTRIAIS) {
      expect(hrefs.has(destino), `${destino} não aparece mais no menu nem no rodapé`).toBe(true);
    }
  });

  it('nenhuma coluna do rodapé fica vazia em rota NI ao ponto de sumir tudo', () => {
    const sobra = FOOTER_COLUMNS.map((c) => semIndustriaisSeNi(c.links, '/protecao-comercial')).filter(
      (l) => l.length > 0,
    );
    expect(sobra.length).toBeGreaterThan(1);
  });
});
