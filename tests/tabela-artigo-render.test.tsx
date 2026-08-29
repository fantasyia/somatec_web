import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlocosArtigo } from '@/components/blog/BlocosArtigo';
import { htmlParaArtigo } from '@/lib/blog/html-para-artigo';
import { blocosDaSecao, type ArticleBlock } from '@/lib/constants/blog-content';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Render em markup estático (o projeto não usa jsdom). Traduzir a tabela e
// nunca desenhá-la seria o mesmo defeito um degrau adiante — por isso o teste
// vai do `content_html` real até o HTML da página.

const ARTIGOS: Record<string, string> = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures-artigos-cms.json'), 'utf-8')
);

const comparativo = htmlParaArtigo(ARTIGOS['master-block-vs-dps-comum']).secoes.find((s) =>
  /comparativo, lado a lado/i.test(s.titulo)
)!;

describe('a tabela chega ao HTML da página', () => {
  const html = renderToStaticMarkup(<BlocosArtigo blocos={blocosDaSecao(comparativo)} />);

  it('sai como <table> de verdade, não como texto', () => {
    expect(html).toContain('<table');
    expect(html).toContain('<thead');
    expect(html).toContain('<tbody');
  });

  it('leva o cabeçalho e o conteúdo das células', () => {
    expect(html).toContain('Critério');
    expect(html).toContain('DPS comum (Classe III)');
    expect(html).toContain('Classificação normativa');
  });

  it('o cabeçalho é <th scope="col"> — leitor de tela depende disso', () => {
    expect(html).toMatch(/<th[^>]*scope="col"/);
  });

  it('rola dentro da própria moldura, não empurra a página de lado', () => {
    expect(html).toMatch(/overflow-x-auto/);
  });
});

describe('parágrafo continua parágrafo', () => {
  it('bloco de texto vira <p>, sem tabela em volta', () => {
    const blocos: ArticleBlock[] = [{ tipo: 'paragrafo', texto: 'Um texto qualquer.' }];
    const html = renderToStaticMarkup(<BlocosArtigo blocos={blocos} />);
    expect(html).toContain('<p');
    expect(html).toContain('Um texto qualquer.');
    expect(html).not.toContain('<table');
  });

  it('seção escrita à mão (sem `blocos`) continua renderizando', () => {
    // O conteúdo de blog-content.ts não tem `blocos` — `blocosDaSecao` deriva.
    const html = renderToStaticMarkup(
      <BlocosArtigo blocos={blocosDaSecao({ paragrafos: ['Linha A', 'Linha B'] })} />
    );
    expect(html).toContain('Linha A');
    expect(html).toContain('Linha B');
  });
});

describe('aviso de rolagem no celular', () => {
  const tabela = (colunas: number): ArticleBlock => ({
    tipo: 'tabela',
    tabela: {
      cabecalho: Array.from({ length: colunas }, (_, i) => `C${i}`),
      linhas: [Array.from({ length: colunas }, (_, i) => `v${i}`)],
    },
  });

  // Medido no Chromium a 360/390px: com 3 colunas a moldura passa da largura
  // do telefone; com 2, cabe. Do tablet pra cima nenhuma das duas rola.
  it('3 colunas avisam que dá pra arrastar', () => {
    expect(renderToStaticMarkup(<BlocosArtigo blocos={[tabela(3)]} />)).toContain('Arraste a tabela');
  });

  it('2 colunas não avisam — não haveria o que arrastar', () => {
    expect(renderToStaticMarkup(<BlocosArtigo blocos={[tabela(2)]} />)).not.toContain('Arraste a tabela');
  });

  it('o aviso é só no celular', () => {
    expect(renderToStaticMarkup(<BlocosArtigo blocos={[tabela(3)]} />)).toMatch(
      // o md:hidden tem que estar NO elemento do aviso, não em outro qualquer
      /md:hidden[^"]*"[^>]*>\s*Arraste a tabela/
    );
  });
});
