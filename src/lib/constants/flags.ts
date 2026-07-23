/**
 * Feature flags do site (via env pública, avaliadas no build/SSR).
 *
 * NEXT_PUBLIC_BLOG_TEASER_ENABLED — liga a seção de blog (teaser da home).
 *
 * ⚠️ TEMP (despacho #13): FORÇADA LIGADA para a validação interna com o
 * Leandro (artigos com stub "conteúdo em preparação"). ANTES DO LANÇAMENTO
 * PÚBLICO: voltar à leitura da env (linha comentada abaixo) — não lançar com
 * placeholder no ar; site segue NOINDEX até lá.
 */
export const BLOG_TEASER_ENABLED = true;
// export const BLOG_TEASER_ENABLED =
//   process.env.NEXT_PUBLIC_BLOG_TEASER_ENABLED === 'true';
