import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants/site';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const revalidate = 3600;

type SlugRow = { slug: string; updated_at: string };
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
  const now = new Date().toISOString();

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
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contato`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/representantes`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const hasValidConfig = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.');

  let solutions: PathRow[] = [];
  let brands: SlugRow[] = [];
  let products: SlugRow[] = [];
  let recipes: SlugRow[] = [];
  let recipeCats: SlugRow[] = [];
  let productCats: SlugRow[] = [];
  let applications: SlugRow[] = [];
  let pages: PathRow[] = [];
  let redirects301: RedirectRow[] = [];

  if (hasValidConfig) {
    try {
      const db = getSupabaseAdminClient();
      const [
        { data: rawSolutions },
        { data: rawBrands },
        { data: rawProducts },
        { data: rawRecipes },
        { data: rawRecipeCats },
        { data: rawProductCats },
        { data: rawApplications },
        { data: rawPages },
        { data: rawRedirects },
      ] = await Promise.all([
        db.from('solutions').select('route_path, updated_at').eq('status', 'published').eq('robots_index', true),
        db.from('brands').select('slug, updated_at').eq('status', 'published').eq('robots_index', true),
        db.from('products').select('slug, updated_at').eq('status', 'published').eq('robots_index', true),
        db.from('recipes').select('slug, updated_at').eq('status', 'published').eq('robots_index', true),
        db.from('recipe_categories').select('slug, updated_at').eq('status', 'published').eq('robots_index', true),
        db.from('product_categories').select('slug, updated_at').eq('status', 'published').eq('robots_index', true),
        db.from('product_applications').select('slug, updated_at').eq('status', 'published').eq('robots_index', true),
        db.from('pages').select('route_path, updated_at').eq('status', 'published').eq('robots_index', true),
        // Redirects 301 → URL canônica é o to_path. Inclui no sitemap para
        // garantir descoberta de URLs que migraram de paths antigos.
        db.from('redirects').select('to_path, status_code, updated_at').eq('active', true).eq('status_code', 301),
      ]);
      solutions = (rawSolutions as unknown as PathRow[] | null) ?? [];
      brands = (rawBrands as unknown as SlugRow[] | null) ?? [];
      products = (rawProducts as unknown as SlugRow[] | null) ?? [];
      recipes = (rawRecipes as unknown as SlugRow[] | null) ?? [];
      recipeCats = (rawRecipeCats as unknown as SlugRow[] | null) ?? [];
      productCats = (rawProductCats as unknown as SlugRow[] | null) ?? [];
      applications = (rawApplications as unknown as SlugRow[] | null) ?? [];
      pages = (rawPages as unknown as PathRow[] | null) ?? [];
      redirects301 = (rawRedirects as unknown as RedirectRow[] | null) ?? [];
    } catch {
      // fallback: sitemap retorna apenas entradas estáticas
    }
  }

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...solutions.map((s) => toEntry(`${base}${s.route_path}`, s.updated_at, { priority: 0.7 })),
    ...brands.map((b) => toEntry(`${base}/marcas/${b.slug}`, b.updated_at, { priority: 0.7 })),
    ...products.map((p) => toEntry(`${base}/produtos/${p.slug}`, p.updated_at, { priority: 0.7 })),
    ...recipes.map((r) => toEntry(`${base}/receitas/${r.slug}`, r.updated_at, { priority: 0.6 })),
    ...recipeCats.map((c) => toEntry(`${base}/receitas/categoria/${c.slug}`, c.updated_at)),
    ...productCats.map((c) => toEntry(`${base}/produtos/categoria/${c.slug}`, c.updated_at)),
    ...applications.map((a) => toEntry(`${base}/produtos/aplicacao/${a.slug}`, a.updated_at)),
    ...pages.map((p) => toEntry(`${base}${p.route_path}`, p.updated_at, { priority: 0.6, freq: 'monthly' })),
  ];

  // Destinos de redirects 301 são URLs canônicas. Adicionamos com prioridade
  // baixa e freq monthly — garante descoberta sem competir com a entry original
  // da página. Dedup: ignora se to_path já está em outra entry.
  const knownUrls = new Set([...staticEntries, ...dynamicEntries].map((e) => e.url));
  const redirectEntries: MetadataRoute.Sitemap = redirects301
    .map((r) => {
      const url = r.to_path.startsWith('http') ? r.to_path : `${base}${r.to_path}`;
      return knownUrls.has(url)
        ? null
        : toEntry(url, r.updated_at, { priority: 0.4, freq: 'monthly' as const });
    })
    .filter((e): e is MetadataRoute.Sitemap[0] => e !== null);

  void now; // consumed via new Date()
  return [...staticEntries, ...dynamicEntries, ...redirectEntries];
}
