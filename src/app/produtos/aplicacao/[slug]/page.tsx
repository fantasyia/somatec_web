import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { ProductCard, formatPrimaryPackaging, type ProductCardData } from '@/components/products/ProductCard';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };
type AppMeta = { name: string; seo_title: string | null };
type AppRow = { id: string; name: string; description: string | null };
type LinkRow = { product_id: string };
type RawProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  main_image_url: string | null;
  brands: { name: string } | null;
  product_packaging_options: { label: string | null; weight_or_volume: string | null; is_primary: boolean }[] | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data } = await db.from('product_applications').select('name, seo_title').eq('slug', slug).single();
  const row = data as unknown as AppMeta | null;
  if (!row) return { title: 'Aplicação não encontrada' };
  return { title: row.seo_title ?? `${row.name} — Produtos MSM`, robots: { index: false, follow: true } };
}

export default async function AplicacaoSlugPage({ params }: Props) {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const [{ data: rawApp }, { data: rawLinks }, { data: rawProducts }] = await Promise.all([
    db.from('product_applications').select('id, name, description').eq('slug', slug).eq('status', 'published').single(),
    db.from('product_application_links').select('product_id'),
    db.from('products').select('id, name, slug, short_description, main_image_url, brands(name), product_packaging_options(label, weight_or_volume, is_primary)').eq('status', 'published').order('display_order'),
  ]);

  const application = rawApp as unknown as AppRow | null;
  if (!application) notFound();

  const links = (rawLinks as unknown as LinkRow[] | null) ?? [];
  const products = (rawProducts as unknown as RawProduct[] | null) ?? [];
  const linkedIds = new Set(links.map((l) => l.product_id));
  const filtered: ProductCardData[] = products
    .filter((p) => linkedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      short_description: p.short_description,
      main_image_url: p.main_image_url,
      brandName: p.brands?.name ?? null,
      packaging: formatPrimaryPackaging(p.product_packaging_options),
    }));

  return (
    <>
      <PageHero
        eyebrow="Aplicação"
        title={application.name}
        description={application.description ?? `Produtos MSM recomendados para ${application.name}.`}
        breadcrumbs={[{ label: 'Produtos', href: '/produtos' }, { label: application.name }]}
      />

      <section className="container-msm py-10 md:py-14">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-5 py-12">
            <h2 className="font-serif text-h2-m font-semibold">Produtos em publicação</h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Os produtos para esta aplicação estão sendo publicados. Entre em contato para informações.
            </p>
            <CommercialCta
              label="Falar com a equipe"
              context={`Aplicação ${application.name}`}
              fallbackPath="/contato#b2b"
              className="inline-flex"
            />
          </div>
        )}
      </section>
    </>
  );
}
