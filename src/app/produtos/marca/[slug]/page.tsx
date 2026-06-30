import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { ProductCard, formatPrimaryPackaging, type ProductCardData } from '@/components/products/ProductCard';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };
type BrandMeta = { name: string; seo_title: string | null };
type BrandRow = { id: string; name: string; slug: string; short_description: string | null };
type RawProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  main_image_url: string | null;
  brand_id: string | null;
  product_packaging_options: { label: string | null; weight_or_volume: string | null; is_primary: boolean }[] | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data } = await db.from('brands').select('name, seo_title').eq('slug', slug).single();
  const row = data as unknown as BrandMeta | null;
  if (!row) return { title: 'Marca não encontrada' };
  return { title: row.seo_title ?? `Produtos ${row.name} — MSM`, robots: { index: false, follow: true } };
}

export default async function ProdutosDaMarcaPage({ params }: Props) {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const [{ data: rawBrand }, { data: rawProducts }] = await Promise.all([
    db.from('brands').select('id, name, slug, short_description').eq('slug', slug).eq('status', 'published').single(),
    db.from('products').select('id, name, slug, short_description, main_image_url, brand_id, product_packaging_options(label, weight_or_volume, is_primary)').eq('status', 'published').order('display_order'),
  ]);

  const brand = rawBrand as unknown as BrandRow | null;
  if (!brand) notFound();

  const allProducts = (rawProducts as unknown as RawProduct[] | null) ?? [];
  // Eyebrow de marca omitido aqui (brandName null) — é a página da própria marca.
  const filtered: ProductCardData[] = allProducts
    .filter((p) => p.brand_id === brand.id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      short_description: p.short_description,
      main_image_url: p.main_image_url,
      brandName: null,
      packaging: formatPrimaryPackaging(p.product_packaging_options),
    }));

  return (
    <>
      <PageHero
        eyebrow="Marca"
        title={`Produtos · ${brand.name}`}
        description={brand.short_description ?? `Conheça os produtos da linha ${brand.name}.`}
        breadcrumbs={[
          { label: 'Produtos', href: '/produtos' },
          { label: 'Marcas', href: '/marcas' },
          { label: brand.name, href: `/marcas/${brand.slug}` },
          { label: 'Produtos' },
        ]}
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
              Os produtos da marca {brand.name} estão sendo publicados. Entre em contato para informações.
            </p>
            <CommercialCta
              label="Falar com a equipe"
              context={`Marca ${brand.name}`}
              fallbackPath="/contato#b2b"
              className="inline-flex"
            />
          </div>
        )}
      </section>
    </>
  );
}
