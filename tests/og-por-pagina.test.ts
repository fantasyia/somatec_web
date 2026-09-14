import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import type { Metadata } from 'next';
import { comOpenGraph, OG_LOCALE } from '@/lib/seo/metadata-pagina';
import { SITE } from '@/lib/constants/site';

// =============================================================================
// og:url E og:title ERAM OS DA HOME EM METADE DO SITE.
//
// Medido em produção em 13/09: `/protecao-residencial`, `/faq`, `/contato` e
// `/a-somatec/*` serviam
//
//   <link rel="canonical" href="https://www.somatecblocking.com.br/faq">
//   <meta property="og:url" content="https://www.somatecblocking.com.br">
//
// — canonical certo, og:url da home. Causa: em Next, página que não declara
// `openGraph` herda o do layout INTEIRO, e o layout crava `url: SITE.url`.
// Compartilhar a LP no WhatsApp gerava o card da home.
//
// ⚠️ A armadilha ao consertar: `openGraph` de página SUBSTITUI o do layout,
// sem deep-merge. Declarar só `url` apagaria siteName, locale, type e images —
// trocaria um defeito por outro pior (card sem imagem). Por isso o helper
// reemite o bloco completo, e é isso que o segundo teste guarda.
// =============================================================================

const APP = resolve(process.cwd(), 'src/app');

function paginas(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) paginas(caminho, out);
    else if (nome === 'page.tsx') out.push(caminho);
  }
  return out;
}

describe('comOpenGraph deriva o og da própria página', () => {
  const meta: Metadata = {
    title: { absolute: 'Perguntas frequentes — Somatec Blocking' },
    description: 'Dúvidas sobre o Master Block.',
    alternates: { canonical: '/faq' },
  };

  it('og:url é o canonical da página, não a home', () => {
    expect(comOpenGraph(meta).openGraph?.url).toBe('/faq');
  });

  it('og:title é o título da página', () => {
    expect(comOpenGraph(meta).openGraph?.title).toBe('Perguntas frequentes — Somatec Blocking');
  });

  it('🔴 NÃO perde siteName, locale, type e imagem (página substitui o layout)', () => {
    const og = comOpenGraph(meta).openGraph as Record<string, unknown>;
    expect(og.siteName).toBe(SITE.fullName);
    expect(og.locale).toBe(OG_LOCALE);
    expect(og.type).toBe('website');
    expect(Array.isArray(og.images) && (og.images as unknown[]).length).toBeGreaterThan(0);
  });

  it('openGraph explícito da página continua vencendo', () => {
    const comProprio = comOpenGraph({ ...meta, openGraph: { url: '/outro', type: 'article' } });
    expect(comProprio.openGraph?.url).toBe('/outro');
    expect((comProprio.openGraph as Record<string, unknown>).type).toBe('article');
  });

  it('não inventa campo quando a página não declara', () => {
    const og = comOpenGraph({ title: { absolute: 'X' } }).openGraph as Record<string, unknown>;
    expect(og.url).toBeUndefined();
    expect(og.description).toBeUndefined();
  });
});

describe('og:locale é pt_BR, e <html lang> é pt-BR', () => {
  it('OG_LOCALE usa underscore', () => {
    // Open Graph pede language_TERRITORY. Com o hífen, Facebook e LinkedIn
    // ignoram o campo (M23 da auditoria).
    expect(OG_LOCALE).toBe('pt_BR');
  });

  it('SITE.locale continua com hífen — é o do atributo lang', () => {
    expect(SITE.locale).toBe('pt-BR');
  });

  it('o layout usa OG_LOCALE no openGraph, não SITE.locale', () => {
    const layout = readFileSync(resolve(APP, 'layout.tsx'), 'utf-8');
    expect(layout).toMatch(/locale:\s*OG_LOCALE/);
    expect(layout).not.toMatch(/locale:\s*SITE\.locale/);
  });
});

describe('⛔ página com canonical não pode ficar com o og:url da home', () => {
  // A HOME é a única isenção legítima: o `openGraph.url` do layout é
  // justamente a URL dela, então herdar está certo. Qualquer outra página
  // herdando significa og:url apontando pra home.
  const HOME = resolve(APP, 'page.tsx');

  const comCanonical = paginas(APP)
    .filter((p) => p !== HOME)
    .filter((p) => /alternates:\s*\{\s*canonical/.test(readFileSync(p, 'utf-8')));

  it('a varredura acha páginas (não passa por estar vazia)', () => {
    expect(comCanonical.length).toBeGreaterThan(10);
  });

  it.each(comCanonical.map((p) => relative(process.cwd(), p)))('%s', (rel) => {
    const fonte = readFileSync(resolve(process.cwd(), rel), 'utf-8');
    const usaHelper = fonte.includes('comOpenGraph');
    const temOgUrlProprio = /openGraph:\s*\{[\s\S]{0,600}?url:/.test(fonte);
    expect(
      usaHelper || temOgUrlProprio,
      `${rel} declara canonical mas herda o openGraph do layout — o og:url vai ser o da home. ` +
        `Envolva o metadata em comOpenGraph({...}) ou declare openGraph.url.`,
    ).toBe(true);
  });
});
