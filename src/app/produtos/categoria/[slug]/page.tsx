import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { ProductCard, formatPrimaryPackaging, type ProductCardData } from '@/components/products/ProductCard';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };
type CatMeta = { name: string; seo_title: string | null };
type CatRow = { id: string; name: string; description: string | null };
type RawProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  main_image_url: string | null;
  category_id: string | null;
  brands: { name: string } | null;
  product_packaging_options: { label: string | null; weight_or_volume: string | null; is_primary: boolean }[] | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data } = await db.from('product_categories').select('name, seo_title').eq('slug', slug).single();
  const row = data as unknown as CatMeta | null;
  if (!row) return { title: 'Categoria não encontrada' };
  return { title: row.seo_title ?? `${row.name} — Produtos MSM`, robots: { index: false, follow: true } };
}

export default async function CategoriaSlugPage({ params }: Props) {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const [{ data: rawCat }, { data: rawProducts }] = await Promise.all([
    db.from('product_categories').select('id, name, description').eq('slug', slug).eq('status', 'published').single(),
    db.from('products').select('id, name, slug, short_description, main_image_url, category_id, brands(name), product_packaging_options(label, weight_or_volume, is_primary)').eq('status', 'published').order('display_order'),
  ]);

  const category = rawCat as unknown as CatRow | null;
  if (!category) notFound();

  const allProducts = (rawProducts as unknown as RawProduct[] | null) ?? [];
  const filtered: ProductCardData[] = allProducts
    .filter((p) => p.category_id === category.id)
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
        eyebrow="Categoria"
        title={category.name}
        description={category.description ?? undefined}
        breadcrumbs={[{ label: 'Produtos', href: '/produtos' }, { label: category.name }]}
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
              Os produtos desta categoria estão sendo publicados. Entre em contato para informações.
            </p>
            <CommercialCta
              label="Falar com a equipe"
              context={`Categoria ${category.name}`}
              fallbackPath="/contato#b2b"
              className="inline-flex"
            />
          </div>
        )}
      </section>
    </>
  );
}
