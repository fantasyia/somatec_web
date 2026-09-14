import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants/site';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { lerPosts } from '@/lib/blog/fonte';
import { autoresComPagina } from '@/lib/constants/autores';

// Sempre fresco: o cache de build persistente do Railway (.next/cache) já
// serviu sitemap com dados velhos do banco (URLs /a-msm removidas). Sitemap é
// baixo tráfego — vale gerar sob demanda direto do banco.
export const dynamic = 'force-dynamic';

type PathRow = { route_path: string; updated_at: string };
type RedirectRow = { to_path: string; status_code: number; updated_at: string };

/**
 * ⚠️ `lastModified` só entra quando a data é REAL.
 *
 * Até 13/09 o sitemap carimbava `new Date()` em 20 das 26 URLs: toda página
 * institucional aparecia como "modificada agora" a cada requisição. O Google
 * trata isso como ruído e passa a IGNORAR o campo no site inteiro — inclusive
 * nos artigos, onde a data é verdadeira e útil. Sem data é melhor que com data
 * falsa: o campo é opcional.
 */
function toEntry(
  url: string,
  updated: string | null,
  opts: { priority?: number; freq?: MetadataRoute.Sitemap[0]['changeFrequency'] } = {},
): MetadataRoute.Sitemap[0] {
  return {
    url,
    ...(updated ? { lastModified: new Date(updated) } : {}),
    changeFrequency: opts.freq ?? 'weekly',
    priority: opts.priority ?? 0.6,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/produtos`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/protecao-residencial`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/protecao-comercial`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/orcamento-industrial`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/a-somatec`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/a-somatec/quem-somos`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/a-somatec/tecnologia-e-fabricacao`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/a-somatec/comprovacao-e-normas`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/ferramentas/custo-de-parada`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/resultados`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/industrias/alimenticia`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/industrias/autopecas`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/industrias/metalurgia`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/industrias/textil`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contato`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/representantes`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  // ── BLOG ─────────────────────────────────────────────────────────────
  // O sitemap não conhecia o blog: nem o índice, nem um artigo sequer. Ele
  // listava só as páginas institucionais e a tabela `pages` (do admin que
  // saiu, e vazia). No go-live isso deixaria o motor de SEO inteiro fora do
  // arquivo que o Google usa pra descobrir URL — e a falha é muda.
  //
  // Sai da MESMA fonte que renderiza o blog, então artigo publicado no CMS
  // entra aqui sozinho. Se o banco não responder, `lerPosts` cai no arquivo e
  // o sitemap sai com o que houver, em vez de quebrar.
  let blogEntries: MetadataRoute.Sitemap = [];
  let autorEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await lerPosts();
    blogEntries = posts.map((post) =>
      toEntry(`${base}/blog/${post.slug}`, post.atualizadoEm || post.publicadoEm || null, {
        priority: 0.7,
        freq: 'monthly',
      }),
    );
    // Página de autor só entra se a pessoa tem artigo publicado — perfil sem
    // conteúdo é página fina, e página fina no sitemap atrapalha em vez de
    // ajudar.
    if (posts.length > 0) {
      autorEntries = autoresComPagina().map((a) =>
        toEntry(`${base}/autor/${a.slug}`, null, {
          priority: 0.4,
          freq: 'monthly',
        }),
      );
    }
  } catch {
    // sitemap sem o blog é ruim, sitemap quebrado é pior
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const hasValidConfig = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.');

  let pages: PathRow[] = [];
  let redirects301: RedirectRow[] = [];

  if (hasValidConfig) {
    try {
      const db = getSupabaseAdminClient();
      const [{ data: rawPages }, { data: rawRedirects }] = await Promise.all([
        db.from('pages').select('route_path, updated_at').eq('status', 'published').eq('robots_index', true),
        db.from('redirects').select('to_path, status_code, updated_at').eq('active', true).eq('status_code', 301),
      ]);
      pages = (rawPages as unknown as PathRow[] | null) ?? [];
      redirects301 = (rawRedirects as unknown as RedirectRow[] | null) ?? [];
    } catch {
      // fallback: sitemap retorna apenas entradas estáticas
    }
  }

  const dynamicEntries: MetadataRoute.Sitemap = pages.map((p) =>
    toEntry(`${base}${p.route_path}`, p.updated_at, { priority: 0.6, freq: 'monthly' }),
  );

  // Destinos de redirects 301 (URLs canônicas) — dedup contra entries já conhecidas.
  const knownUrls = new Set(
    [...staticEntries, ...dynamicEntries, ...blogEntries, ...autorEntries].map((e) => e.url),
  );
  const redirectEntries: MetadataRoute.Sitemap = redirects301
    .map((r) => {
      const url = r.to_path.startsWith('http') ? r.to_path : `${base}${r.to_path}`;
      return knownUrls.has(url)
        ? null
        : toEntry(url, r.updated_at, { priority: 0.4, freq: 'monthly' as const });
    })
    .filter((e): e is MetadataRoute.Sitemap[0] => e !== null);

  return [...staticEntries, ...blogEntries, ...autorEntries, ...dynamicEntries, ...redirectEntries];
}
