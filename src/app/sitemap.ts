import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants/site';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

// Sempre fresco: o cache de build persistente do Railway (.next/cache) já
// serviu sitemap com dados velhos do banco (URLs /a-msm removidas). Sitemap é
// baixo tráfego — vale gerar sob demanda direto do banco.
export const dynamic = 'force-dynamic';

type PathRow = { route_path: string; updated_at: string };
type RedirectRow = { to_path: string; status_code: number; updated_at: string };

function toEntry(
  url: string,
  updated: string,
  opts: { priority?: number; freq?: MetadataRoute.Sitemap[0]['changeFrequency'] } = {},
): MetadataRoute.Sitemap[0] {
  return {
    url,
    lastModified: new Date(updated),
    changeFrequency: opts.freq ?? 'weekly',
    priority: opts.priority ?? 0.6,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/produtos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/solucoes`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/solucoes/protecao-contra-surtos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/solucoes/qualidade-de-energia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/solucoes/banco-de-capacitores`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/solucoes/medicao-e-laudos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/solucoes/manutencao-cabine-primaria`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/a-somatec`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/a-somatec/quem-somos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/a-somatec/tecnologia-e-fabricacao`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/a-somatec/comprovacao-e-normas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/ferramentas/custo-de-parada`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contato`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/representantes`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

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
  const knownUrls = new Set([...staticEntries, ...dynamicEntries].map((e) => e.url));
  const redirectEntries: MetadataRoute.Sitemap = redirects301
    .map((r) => {
      const url = r.to_path.startsWith('http') ? r.to_path : `${base}${r.to_path}`;
      return knownUrls.has(url)
        ? null
        : toEntry(url, r.updated_at, { priority: 0.4, freq: 'monthly' as const });
    })
    .filter((e): e is MetadataRoute.Sitemap[0] => e !== null);

  return [...staticEntries, ...dynamicEntries, ...redirectEntries];
}
