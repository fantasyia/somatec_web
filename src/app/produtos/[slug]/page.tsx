import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Package, FileText } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { SampleRequestModal } from '@/components/products/SampleRequestModal';
import { JsonLd } from '@/components/seo/JsonLd';
import { productSchema } from '@/lib/seo/structured-data';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Product, ProductPackagingOption } from '@/types/database';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };
type ProductMeta = Pick<Product, 'name' | 'seo_title' | 'seo_description' | 'og_title' | 'og_description' | 'og_image_url' | 'canonical_url' | 'robots_index' | 'robots_follow' | 'main_image_url'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data } = await db
    .from('products')
    .select('name, seo_title, seo_description, og_title, og_description, og_image_url, canonical_url, robots_index, robots_follow, main_image_url')
    .eq('slug', slug)
    .single();
  const row = data as unknown as ProductMeta | null;
  if (!row) return { title: 'Produto não encontrado' };
  const title = row.seo_title ?? `${row.name} — MSM`;
  const ogImage = row.og_image_url ?? row.main_image_url;
  return {
    title,
    description: row.seo_description ?? undefined,
    robots: { index: row.robots_index, follow: row.robots_follow },
    ...(row.canonical_url ? { alternates: { canonical: row.canonical_url } } : {}),
    openGraph: {
      title: row.og_title ?? title,
      description: row.og_description ?? row.seo_description ?? undefined,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      type: 'website',
    },
  };
}

export default async function ProdutoSlugPage({ params }: Props) {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data: rawProduct } = await db.from('products').select('*').eq('slug', slug).eq('status', 'published').single();
  const product = rawProduct as unknown as Product | null;

  if (!product) notFound();

  const { data: rawPkg } = await db.from('product_packaging_options').select('*').eq('product_id', product.id).eq('active', true).order('display_order');
  const packaging = (rawPkg as unknown as ProductPackagingOption[] | null) ?? [];

  // Brand + category names para o JSON-LD
  let brandName: string | null = null;
  let categoryName: string | null = null;
  if (product.brand_id) {
    const { data: b } = await db.from('brands').select('name').eq('id', product.brand_id).maybeSingle();
    brandName = (b as { name: string } | null)?.name ?? null;
  }
  if (product.category_id) {
    const { data: c } = await db.from('product_categories').select('name').eq('id', product.category_id).maybeSingle();
    categoryName = (c as { name: string } | null)?.name ?? null;
  }

  return (
    <>
      <JsonLd
        data={productSchema({
          name: product.name,
          slug: product.slug,
          description: product.short_description ?? product.full_description,
          image: product.main_image_url,
          brandName,
          categoryName,
        })}
      />

      <PageHero
        eyebrow="Produto"
        title={product.name}
        description={product.short_description ?? undefined}
        breadcrumbs={[{ label: 'Produtos', href: '/produtos' }, { label: product.name }]}
      />

      <section className="container-msm py-10 md:py-14">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">

          <div className="aspect-square rounded-card-lg overflow-hidden relative bg-[rgb(var(--border))]">
            {product.main_image_url ? (
              <Image src={product.main_image_url} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="h-16 w-16 text-[rgb(var(--text-muted))]" strokeWidth={1} />
              </div>
            )}
          </div>

          <div className="space-y-8">
            {product.full_description && (
              <div className="space-y-3">
                <span className="eyebrow text-[11px]">Descrição</span>
                <p className="text-[rgb(var(--text-muted))] leading-relaxed">{product.full_description}</p>
              </div>
            )}

            {product.packaging_summary && (
              <div className="space-y-2">
                <span className="eyebrow text-[11px]">Embalagem</span>
                <p className="text-sm text-[rgb(var(--text-muted))]">{product.packaging_summary}</p>
              </div>
            )}

            {packaging.length > 0 && (
              <div className="space-y-3">
                <span className="eyebrow text-[11px]">Opções de embalagem</span>
                <div className="space-y-2">
                  {packaging.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between p-3 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm">
                      <span className="font-sans font-semibold text-[rgb(var(--text))]">{opt.label}</span>
                      {opt.weight_or_volume && (
                        <span className="text-[rgb(var(--text-muted))]">{opt.weight_or_volume}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.commercial_notes && (
              <div className="space-y-2">
                <span className="eyebrow text-[11px]">Notas comerciais</span>
                <p className="text-sm text-[rgb(var(--text-muted))]">{product.commercial_notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <CommercialCta
                label="Solicitar proposta"
                context={product.name}
                fallbackPath="/contato#b2b"
              />
              <SampleRequestModal productId={product.id} productName={product.name} />
              {product.technical_sheet_url && (
                <a
                  href={product.technical_sheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[rgb(var(--text))] inline-flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" strokeWidth={1.5} />
                  Ficha técnica
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
