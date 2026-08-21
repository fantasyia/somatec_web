import { getBlogPosts } from '@/lib/constants/blog';
import { publicoDoCluster } from '@/lib/constants/publico-clusters';

// =============================================================================
// Quais rotas o público NÃO INDUSTRIAL está lendo.
//
// Serve pras superfícies GLOBAIS — menu e rodapé — que aparecem em toda página
// e por isso serviam ferramenta industrial (custo de parada, projeto da planta)
// pra dono de casa e de padaria. O corpo das páginas já é segmentado; o que
// vazava era o que fica em volta delas.
//
// Decisão do Léo (2026-08-21): esconder nas rotas NI. Não é renomear nem
// remover do site — o comprador industrial continua achando tudo pelo caminho
// dele; some só de quem a regra diz que não deveria ver.
// =============================================================================

/** LPs de compra direta — NI por definição. */
const LPS_NI = ['/protecao-residencial', '/protecao-comercial'];

/** Artigos de casa/comércio. O público sai do CLUSTER (config única), a mesma
 *  fonte que as LPs e o template de artigo já usam — não há segunda lista pra
 *  alguém esquecer de atualizar quando publicar artigo novo. */
function slugsNi(): string[] {
  return getBlogPosts()
    .filter((p) => publicoDoCluster(p.cluster) !== null)
    .map((p) => `/blog/${p.slug}`);
}

/** true quando quem está lendo a página é comércio ou residência. */
export function ehRotaNi(pathname: string | null): boolean {
  if (!pathname) return false;
  if (LPS_NI.includes(pathname)) return true;
  return slugsNi().includes(pathname);
}

/** Destinos que só fazem sentido pra quem tem linha de produção. Some das
 *  superfícies globais quando a rota é NI. */
export const DESTINOS_INDUSTRIAIS = ['/ferramentas/custo-de-parada', '/orcamento-industrial'];

/** Remove os links industriais quando a rota é NI (senão devolve como veio). */
export function semIndustriaisSeNi<T extends { href: string }>(itens: T[], pathname: string | null): T[] {
  if (!ehRotaNi(pathname)) return itens;
  return itens.filter((i) => !DESTINOS_INDUSTRIAIS.includes(i.href));
}
