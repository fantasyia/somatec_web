import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogIndex } from '@/components/blog/BlogIndex';
import type { BlogPost } from '@/lib/constants/blog';

// =============================================================================
// FILTRO DO ÍNDICE DO BLOG — a lista tem de sair dos artigos, não do código.
//
// Achado em 14/09, publicando os 4 primeiros artigos pelo CMS: a tarja do card
// dizia "Custo" e o chip do filtro dizia "Custo & ROI". A lista de chips era a
// constante `BLOG_CLUSTERS`, escrita à mão quando o acervo vinha do arquivo; o
// tema real de um artigo do CMS é o nome do SILO.
//
// Efeito medido: cinco chips filtravam pra lista vazia e dois temas que
// existiam não tinham chip nenhum. Nenhum erro, nenhum log — o leitor só não
// achava o artigo.
//
// Render em markup estático, como os outros testes de componente deste repo.
// =============================================================================

function post(slug: string, cluster: string): BlogPost {
  return {
    slug,
    titulo: `Artigo ${slug}`,
    excerpt: 'resumo',
    cluster,
    tempoLeitura: 3,
    heroUrl: null,
    publicadoEm: '2026-09-01',
  } as BlogPost;
}

/** Texto dos chips do grupo "Filtrar por assunto". */
function chips(html: string): string[] {
  const grupo = html.slice(html.indexOf('Filtrar por assunto'));
  const fim = grupo.indexOf('</div>');
  return [...grupo.slice(0, fim).matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((m) => m[1].trim());
}

describe('filtros do índice do blog', () => {
  it('mostra um chip para cada tema presente no acervo', () => {
    const html = renderToStaticMarkup(
      <BlogIndex posts={[post('a', 'Custo'), post('b', 'Proteção'), post('c', 'Custo')]} />,
    );
    const lista = chips(html);
    expect(lista[0]).toBe('Todos');
    expect(lista).toContain('Custo');
    expect(lista).toContain('Proteção');
    // 'Custo' aparece em dois artigos e mesmo assim é um chip só.
    expect(lista.filter((c) => c === 'Custo')).toHaveLength(1);
  });

  it('não inventa chip de tema que não tem artigo', () => {
    const html = renderToStaticMarkup(<BlogIndex posts={[post('a', 'Custo')]} />);
    const lista = chips(html);
    // Os dois eram chips FIXOS e não existem no acervo do CMS.
    expect(lista).not.toContain('Custo & ROI');
    expect(lista).not.toContain('Proteção Elétrica');
    expect(lista).toEqual(['Todos', 'Custo']);
  });

  it('acervo vazio deixa só o "Todos"', () => {
    const html = renderToStaticMarkup(<BlogIndex posts={[]} />);
    expect(chips(html)).toEqual(['Todos']);
  });
});
