import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';

// =============================================================================
// AS 32 URLs DO SITE ANTIGO — e a que importa de verdade.
//
// Medido em 11/09 no Search Console e no índice do Google: existiu um site
// neste domínio, em três idiomas, com blog e páginas de produto. As 32 URLs
// respondem 404 hoje.
//
// 🔴 O motivo de existir esta guarda NÃO é SEO. É a OFERTA EXTINTA:
//
//     /produto/servico-de-medicoes-e-laudos
//
// "Serviço de Medições e Laudos" é a mecânica que morreu em 20/08 — ir medir na
// planta ANTES do contrato. A página não serve nada, mas o RESULTADO DE BUSCA
// existe, com o título da época. O 301 é o que faz o Google trocar aquela
// entrada por /produtos quando recrawlear.
//
// Se alguém apagar essas regras achando que são lixo de site velho (afinal, o
// tráfego é zero — 9 páginas com impressão em 16 meses, nenhum clique), a
// oferta extinta volta a ser o que o Google mostra de mais específico sobre
// "medição" e "laudo" neste domínio. Por isso o teste trava.
// =============================================================================

type Regra = { source: string; destination: string; permanent?: boolean };

async function regras(): Promise<Regra[]> {
  const config = (await import(resolve(process.cwd(), 'next.config.js'))) as {
    default?: { redirects?: () => Promise<Regra[]> };
    redirects?: () => Promise<Regra[]>;
  };
  const alvo = config.default ?? config;
  return (await alvo.redirects!()) as Regra[];
}

/** Onde uma URL cai, respeitando que o Next usa a PRIMEIRA regra que casa. */
function destinoDe(lista: Regra[], url: string): string | null {
  for (const r of lista) {
    const padrao = new RegExp(
      '^' +
        r.source
          .replace(/\/:\w+\*/g, '(?:/.*)?') // /:slug* — inclusive vazio
          .replace(/\/:\w+/g, '/[^/]+') + // /:slug
        '$',
    );
    if (padrao.test(url)) return r.destination;
  }
  return null;
}

describe('🔴 a oferta extinta não pode continuar sendo o resultado de busca', () => {
  it('/produto/servico-de-medicoes-e-laudos sai de cena', async () => {
    expect(destinoDe(await regras(), '/produto/servico-de-medicoes-e-laudos')).toBe('/produtos');
  });

  it('e a regra é permanente — 302 não substitui a entrada no índice', async () => {
    const r = (await regras()).find((x) => x.source.startsWith('/produto/'));
    expect(r?.permanent).toBe(true);
  });
});

describe('as 32 URLs do site antigo têm destino', () => {
  it.each([
    // produto, nos três idiomas
    ['/produto/banco-de-capacitores', '/produtos'],
    ['/produto/servicos-de-manutencao', '/produtos'],
    ['/en/product/master-block', '/produtos'],
    ['/en/product/retentor-eletromagnetico', '/produtos'],
    ['/es/producto/electromagnetic-retainers', '/produtos'],
    // o blog antigo
    ['/conteudos', '/blog'],
    ['/conteudos/reducao-de-custos-no-mercadao-de-sao-paulo', '/blog'],
    ['/en/contents', '/blog'],
    ['/en/contents/somatec-blocking-conducts-training-with-a-team-of-representatives', '/blog'],
    ['/es/contenido/e-book-master-block-la-solucion-eficaz-contra-la-quema-de-equipos', '/blog'],
    // institucional
    ['/clientes', '/resultados'],
    // raízes de idioma — o site novo é só PT
    ['/es', '/'],
    ['/en', '/'],
  ])('%s → %s', async (de, para) => {
    expect(destinoDe(await regras(), de)).toBe(para);
  });
});

describe('⚠️ a ordem das regras — o curinga de idioma não pode comer as específicas', () => {
  it('/en/product/x vai pra /produtos, NÃO pra home', async () => {
    // Se `/en/:path*` for declarado antes de `/en/product/:slug*`, esta quebra.
    // O Next usa a primeira que casa, e o resultado seria mandar toda página de
    // produto em inglês pra home — um destino pior e sem relação com a origem.
    expect(destinoDe(await regras(), '/en/product/capacitors-banks')).toBe('/produtos');
  });

  it('/es/contenido/x vai pra /blog, NÃO pra home', async () => {
    expect(destinoDe(await regras(), '/es/contenido/qualquer-artigo')).toBe('/blog');
  });
});

describe('⛔ não redirecionar o que o site novo ATENDE', () => {
  it.each(['/contato', '/produtos', '/blog', '/resultados', '/'])(
    '%s continua sendo servido pelo site',
    async (rota) => {
      expect(destinoDe(await regras(), rota)).toBeNull();
    },
  );
});
