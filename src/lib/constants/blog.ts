/**
 * Fonte de dados do blog — ARRAY LOCAL que simula o WordPress REST API.
 *
 * ⚠️ Contrato idêntico ao shape do WP REST (post): quando a integração WP
 * chegar, troca-se APENAS a origem destes dados (fetch em vez de array); os
 * componentes de card/índice/artigo NÃO mudam. NUNCA hardcodar card no HTML.
 *
 * Copy dos 3 posts em destaque: EXATA como definida pela master (/plano-somatec).
 * Os demais são ESTRUTURAIS (títulos do plano de conteúdo real, excerpt-placeholder)
 * só para exercitar grid/filtro/paginação do /blog — a redação preenche o texto real.
 */

export type BlogPost = {
  slug: string;
  titulo: string;
  excerpt: string;
  /** Cluster/pilar de conteúdo (rótulo exibido na pill). */
  cluster: string;
  /** Tempo de leitura em minutos. */
  tempoLeitura: number;
  /** Imagem hero 16:9; null = usar placeholder (gradiente + ícone do cluster). */
  heroUrl: string | null;
  /** Data de publicação (ISO). */
  publicadoEm: string;
  /** Marca o post destaque (card grande). */
  destaque?: boolean;
  /** CTA interno extra (só no card destaque) — dupla conversão. */
  ctaInterno?: { label: string; href: string };
  /** true = entrada estrutural (sem copy final); some quando o WP entrar. */
  placeholder?: boolean;
};

/** Clusters de conteúdo (ordem = ordem das pills de filtro no /blog). */
export const BLOG_CLUSTERS = [
  'Custo & ROI',
  'Proteção Elétrica',
  'Auto-Diagnóstico',
  'Cases',
  'Setores',
] as const;

export const BLOG_POSTS: readonly BlogPost[] = [
  // ── Os 3 posts do teaser da home — copy EXATA da master ──────────────
  {
    slug: 'quanto-custa-1-hora-de-linha-parada',
    titulo: 'Quanto custa 1 hora de linha parada na sua fábrica?',
    excerpt:
      'O prejuízo não é só a produção que não saiu. Refugo, hora extra, multa de prazo e equipamento queimado entram na conta, e ela costuma ser bem maior do que o diretor imagina. Veja como calcular a sua.',
    cluster: 'Custo & ROI',
    tempoLeitura: 7,
    heroUrl: '/blog/custo-hora-parada.jpg',
    publicadoEm: '2026-07-14',
    destaque: true,
    ctaInterno: { label: 'Calcular o custo da minha parada', href: '/ferramentas/custo-de-parada' },
  },
  {
    slug: 'no-break-nao-protege-contra-surto',
    titulo: 'Seu no-break não protege contra o surto que queima placa',
    excerpt:
      'No-break segura queda de energia. Estabilizador segura variação lenta. Mas o transiente de 100 kHz passa por cima dos dois, e é ele que queima drive, inversor e CLP.',
    cluster: 'Proteção Elétrica',
    tempoLeitura: 5,
    heroUrl: '/blog/nobreak-nao-protege.jpg',
    publicadoEm: '2026-07-10',
  },
  {
    slug: '5-sinais-vtcd-sem-saber',
    titulo: '5 sinais de que sua fábrica sofre com VTCD (sem saber)',
    excerpt:
      "Placa queimada 'do nada', CNC que perde parâmetro, robô que trava sempre no mesmo turno. Se dois desses sinais aparecem aí, sua rede está avisando. Confira o checklist.",
    cluster: 'Auto-Diagnóstico',
    tempoLeitura: 6,
    heroUrl: '/blog/5-sinais-vtcd.jpg',
    publicadoEm: '2026-07-07',
  },

  // ── Entradas ESTRUTURAIS (títulos do plano; excerpt pendente da redação) ──
  {
    slug: 'o-que-e-vtcd',
    titulo: 'O que é VTCD',
    excerpt: 'Resumo em preparação pela redação.',
    cluster: 'Proteção Elétrica',
    tempoLeitura: 6,
    heroUrl: null,
    publicadoEm: '2026-07-02',
    placeholder: true,
  },
  {
    slug: '3-mitos-que-custam-caro',
    titulo: '3 mitos que custam caro',
    excerpt: 'Resumo em preparação pela redação.',
    cluster: 'Proteção Elétrica',
    tempoLeitura: 5,
    heroUrl: null,
    publicadoEm: '2026-06-28',
    placeholder: true,
  },
  {
    slug: 'quem-confia-na-somatec',
    titulo: 'Quem confia na Somatec',
    excerpt: 'Resumo em preparação pela redação.',
    cluster: 'Cases',
    tempoLeitura: 4,
    heroUrl: null,
    publicadoEm: '2026-06-24',
    placeholder: true,
  },
  {
    slug: 'case-cinpal',
    titulo: 'Case Cinpal — 92% de supressão medida em 80 dias',
    excerpt: 'Resumo em preparação pela redação.',
    cluster: 'Cases',
    tempoLeitura: 5,
    heroUrl: null,
    publicadoEm: '2026-06-20',
    placeholder: true,
  },
  {
    slug: 'vtcd-na-industria-alimenticia',
    titulo: 'VTCD na indústria alimentícia',
    excerpt: 'Resumo em preparação pela redação.',
    cluster: 'Setores',
    tempoLeitura: 6,
    heroUrl: null,
    publicadoEm: '2026-06-16',
    placeholder: true,
  },
] as const;

/** Posts ordenados do mais recente ao mais antigo. */
export function getBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.publicadoEm < b.publicadoEm ? 1 : -1));
}

/** O post destaque (mais recente marcado como destaque, senão o mais recente). */
export function getFeaturedPost(): BlogPost {
  const ordered = getBlogPosts();
  return ordered.find((p) => p.destaque) ?? ordered[0];
}

/** Os 3 posts do teaser da home (destaque + os 2 seguintes com hero real). */
export function getTeaserPosts(): BlogPost[] {
  const withHero = getBlogPosts().filter((p) => p.heroUrl);
  const featured = withHero.find((p) => p.destaque) ?? withHero[0];
  const rest = withHero.filter((p) => p.slug !== featured.slug).slice(0, 2);
  return [featured, ...rest];
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
