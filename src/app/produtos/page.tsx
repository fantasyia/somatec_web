import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { ProductCard, formatPrimaryPackaging, type ProductCardData } from '@/components/products/ProductCard';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Produtos — MSM Indústria',
  description:
    'Portfólio de produtos alimentícios B2B da MSM Indústria — soluções para food service, distribuição e marcas próprias, com padrão industrial e rastreabilidade por lote.',
  alternates: { canonical: '/produtos' },
  openGraph: {
    title: 'Produtos — MSM Indústria',
    description:
      'Portfólio de produtos alimentícios B2B da MSM Indústria — soluções para food service, distribuição e marcas próprias, com padrão industrial e rastreabilidade por lote.',
    url: '/produtos',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  main_image_url: string | null;
  brands: { name: string } | null;
  product_packaging_options: { label: string | null; weight_or_volume: string | null; is_primary: boolean }[] | null;
};
type CatCard = { id: string; name: string; slug: string };

export default async function ProdutosPage() {
  const db = await getSupabaseServerClient();
  const [{ data: rawProducts }, { data: rawCategories }, { data: rawBrands }] = await Promise.all([
    db.from('products').select('id, name, slug, short_description, main_image_url, brands(name), product_packaging_options(label, weight_or_volume, is_primary)').eq('status', 'published').order('display_order'),
    db.from('product_categories').select('id, name, slug').eq('status', 'published').order('display_order'),
    db.from('brands').select('id, name, slug').eq('status', 'published').order('display_order'),
  ]);

  const list: ProductCardData[] = ((rawProducts as unknown as RawProduct[] | null) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    short_description: p.short_description,
    main_image_url: p.main_image_url,
    brandName: p.brands?.name ?? null,
    packaging: formatPrimaryPackaging(p.product_packaging_options),
  }));
  const cats = (rawCategories as unknown as CatCard[] | null) ?? [];
  const brandList = (rawBrands as unknown as CatCard[] | null) ?? [];

  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title="Nossos produtos"
        description="Portfólio de produtos alimentícios desenvolvidos com padrão industrial MSM, disponíveis para fornecimento B2B, food service e distribuição."
        breadcrumbs={[{ label: 'Produtos' }]}
      />

      <section className="container-msm py-10 md:py-14">
        {(cats.length > 0 || brandList.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-10">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/produtos/categoria/${c.slug}`}
                className="px-3 py-1.5 rounded-btn border border-[rgb(var(--border))] text-xs font-sans font-semibold text-[rgb(var(--text-muted))] hover:border-gold hover:text-gold transition-colors"
              >
                {c.name}
              </Link>
            ))}
            {brandList.map((b) => (
              <Link
                key={b.id}
                href={`/produtos/marca/${b.slug}`}
                className="px-3 py-1.5 rounded-btn border border-[rgb(var(--border))] text-xs font-sans font-semibold text-[rgb(var(--text-muted))] hover:border-gold hover:text-gold transition-colors"
              >
                {b.name}
              </Link>
            ))}
          </div>
        )}

        {list.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
            <span className="eyebrow">Catálogo</span>
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Catálogo em publicação
            </h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Nosso catálogo de produtos está sendo publicado. Em breve você poderá explorar todo o portfólio MSM com filtros por categoria, marca e aplicação.
            </p>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Para informações sobre produtos e condições de fornecimento, fale diretamente com nossa equipe.
            </p>
            <CommercialCta
              label="Solicitar catálogo"
              fallbackPath="/contato#b2b"
              className="inline-flex mt-2"
            />
          </div>
        )}
      </section>
    </>
  );
}
