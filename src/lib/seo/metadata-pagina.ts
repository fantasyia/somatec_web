import type { Metadata } from 'next';
import { SITE } from '@/lib/constants/site';

// =============================================================================
// M19 DA AUDITORIA 13/09 — og:url e og:title da HOME em toda página.
//
// O layout raiz declara `openGraph: { url: SITE.url, title: <og default do
// banco>, … }`. Em Next, `openGraph` de página SUBSTITUI o do layout (não há
// deep-merge) — mas página que NÃO declara `openGraph` herda o do layout
// inteiro. Resultado medido em produção: `/protecao-residencial`, `/faq`,
// `/contato`, `/a-somatec/*` e mais saíam com
//
//   og:url   = https://www.somatecblocking.com.br
//   og:title = "Master Block — protetor de surto com atuação até 100 kHz"
//
// enquanto o canonical de cada uma apontava pra própria URL. Compartilhar a LP
// residencial no WhatsApp gerava o card da home, e agregador que usa og:url
// como identidade tratava as páginas como sendo a home.
//
// ⚠️ POR QUE O HELPER REEMITE O BLOCO INTEIRO: como página substitui o do
// layout, declarar só `url` apagaria siteName, locale, type e images. Aqui o
// bloco sai completo, derivado do que a própria página já declara — nenhuma
// palavra de copy nova, nenhum texto duplicado no arquivo.
//
// ℹ️ A imagem usa `SITE.ogImage`, que hoje é exatamente o valor de
// `seo_og_default_image` no banco (`/og-default.jpg`, conferido em 14/09). Se
// um dia o banco mudar, as páginas com openGraph próprio ficam na constante —
// é o mesmo comportamento que `/produtos` e `/blog` já têm, e está registrado
// no CLAUDE.md.
// =============================================================================

/** `og:locale` quer `pt_BR` (underscore); `<html lang>` quer `pt-BR`. Eram o
 *  mesmo valor até 13/09, e Facebook/LinkedIn ignoram o hífen (M23). */
export const OG_LOCALE = 'pt_BR';

function tituloDe(meta: Metadata): string | undefined {
  const t = meta.title;
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object' && 'absolute' in t && typeof t.absolute === 'string') {
    return t.absolute;
  }
  return undefined;
}

function canonicalDe(meta: Metadata): string | undefined {
  const c = meta.alternates?.canonical;
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object' && 'url' in c && typeof c.url === 'string') return c.url;
  return undefined;
}

/**
 * Completa o metadata da página com um `openGraph` coerente com ela mesma:
 * `og:url` = o canonical declarado, `og:title` = o título declarado,
 * `og:description` = a description declarada.
 *
 * Só MECÂNICA: não inventa texto. O que a página já diz é o que vai pro card.
 * Um `openGraph` explícito passado pela página continua vencendo.
 */
export function comOpenGraph(meta: Metadata): Metadata {
  const url = canonicalDe(meta);
  const title = tituloDe(meta);
  const description = typeof meta.description === 'string' ? meta.description : undefined;

  return {
    ...meta,
    openGraph: {
      siteName: SITE.fullName,
      locale: OG_LOCALE,
      type: 'website',
      images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.fullName }],
      ...(url ? { url } : {}),
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...meta.openGraph,
    },
  };
}
