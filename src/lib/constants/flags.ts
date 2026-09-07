/**
 * Feature flags do site (via env pública, avaliadas no build/SSR).
 *
 * NEXT_PUBLIC_BLOG_TEASER_ENABLED — liga a seção de blog (teaser da home).
 *
 * Voltou a ler a env em 07/09/2026. Antes estava FORÇADA `true` no código
 * (TEMP do despacho #13, validação interna com o Leandro), o que tirava o
 * controle: pra desligar era preciso editar código e fazer deploy. Agora o
 * valor mora no Railway — hoje `true`, mesmo comportamento de antes.
 *
 * ⚠️ ANTES DO LANÇAMENTO PÚBLICO: o blog tem 5 artigos placeholder. Ou eles
 * ganham conteúdo real, ou esta env vira `false` — não lançar com stub
 * "conteúdo em preparação" indexável. O site segue NOINDEX até lá.
 */
export const BLOG_TEASER_ENABLED =
  process.env.NEXT_PUBLIC_BLOG_TEASER_ENABLED === 'true';
