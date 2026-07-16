/**
 * Feature flags do site (via env pública, avaliadas no build/SSR).
 *
 * NEXT_PUBLIC_BLOG_TEASER_ENABLED — liga a seção de blog (teaser da home).
 * Fica DESLIGADA em produção até existirem 3 artigos reais publicados pela
 * sessão de blog. Em dev/local, setar `=true` no .env.local para revisar o layout.
 */
export const BLOG_TEASER_ENABLED =
  process.env.NEXT_PUBLIC_BLOG_TEASER_ENABLED === 'true';
