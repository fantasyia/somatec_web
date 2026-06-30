import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Brand, Product } from '@/types/database';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };
type BrandMeta = Pick<Brand, 'name' | 'seo_title' | 'seo_description' | 'og_title' | 'og_description' | 'og_image_url' | 'canonical_url' | 'robots_index' | 'robots_follow'>;
type ProductCard = Pick<Product, 'id' | 'name' | 'slug' | 'short_description' | 'main_image_url' | 'featured' | 'brand_id'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data } = await db
    .from('brands')
    .select('name, seo_title, seo_description, og_title, og_description, og_image_url, canonical_url, robots_index, robots_follow')
    .eq('slug', slug)
    .single();
  const row = data as unknown as BrandMeta | null;
  if (!row) return { title: 'Marca não encontrada' };
  const title = row.seo_title ?? `${row.name} — MSM`;
  return {
    title,
    description: row.seo_description ?? undefined,
    robots: { index: row.robots_index, follow: row.robots_follow },
    ...(row.canonical_url ? { alternates: { canonical: row.canonical_url } } : {}),
    openGraph: {
      title: row.og_title ?? title,
      description: row.og_description ?? row.seo_description ?? undefined,
      ...(row.og_image_url ? { images: [{ url: row.og_image_url }] } : {}),
      type: 'website',
    },
  };
}

export default async function MarcaSlugPage({ params }: Props) {
  const { slug } = await params;
  const db = await getSupabaseServerClient();
  const { data: rawBrand } = await db
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  const brand = rawBrand as unknown as Brand | null;
  if (!brand) notFound();

  // Filtra por brand_id NO BANCO antes do limit — antes o .limit(12) pegava os 12
  // primeiros do catálogo inteiro e só depois filtrava em JS, escondendo produtos
  // de marcas que ficassem fora desse top-12 global.
  const { data: rawProducts } = await db
    .from('products')
    .select('id, name, slug, short_description, main_image_url, featured, brand_id')
    .eq('status', 'published')
    .eq('brand_id', brand.id)
    .order('display_order')
    .limit(12);
  const brandProducts = (rawProducts as unknown as ProductCard[] | null) ?? [];

  return (
    <>
      <PageHero
        eyebrow="Marca"
        title={brand.name}
        description={brand.short_description ?? undefined}
        breadcrumbs={[{ label: 'Marcas', href: '/marcas' }, { label: brand.name }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-5">
            {brand.logo_url && (
              <Image
                src={brand.logo_url}
                alt={`Logo ${brand.name}`}
                width={200}
                height={80}
                className="h-16 w-auto object-contain"
              />
            )}
            {brand.full_description && (
              <p className="text-[rgb(var(--text-muted))] leading-relaxed">{brand.full_description}</p>
            )}
            {brand.positioning && (
              <div className="space-y-1">
                <span className="eyebrow text-[11px]">Posicionamento</span>
                <p className="text-sm text-[rgb(var(--text-muted))]">{brand.positioning}</p>
              </div>
            )}
            {brand.target_audience && (
              <div className="space-y-1">
                <span className="eyebrow text-[11px]">Público-alvo</span>
                <p className="text-sm text-[rgb(var(--text-muted))]">{brand.target_audience}</p>
              </div>
            )}
          </div>

          {brand.cover_image_url && (
            <div className="rounded-card-lg overflow-hidden aspect-video relative">
              <Image
                src={brand.cover_image_url}
                alt={brand.name}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {brandProducts.length > 0 && (
          <>
            <div className="divider-gradient" />
            <div className="max-w-5xl mx-auto">
              <div className="mb-8">
                <span className="eyebrow">Portfólio</span>
                <h2 className="mt-3 font-serif text-h2-m font-semibold">Produtos {brand.name}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {brandProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/produtos/${p.slug}`}
                    className="group flex flex-col gap-3 p-6 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-gold hover:-translate-y-0.5 transition-all duration-[250ms] ease-premium"
                  >
                    {p.main_image_url && (
                      <div className="aspect-square rounded overflow-hidden relative bg-[rgb(var(--border))]">
                        <Image src={p.main_image_url} alt={p.name} fill className="object-cover" />
                      </div>
                    )}
                    <h3 className="font-sans font-semibold text-[rgb(var(--text))]">{p.name}</h3>
                    {p.short_description && (
                      <p className="text-xs leading-relaxed text-[rgb(var(--text-muted))] line-clamp-2">{p.short_description}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-semibold text-gold mt-auto">
                      Ver produto
                      <ChevronRight className="h-3 w-3" strokeWidth={2} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="divider-gradient" />

        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Interessado nesta marca?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Fale com nossa equipe comercial para informações sobre disponibilidade, volumes e condições de fornecimento.
          </p>
          <CommercialCta
            label="Solicitar informações"
            context={`Marca ${brand.name}`}
            fallbackPath="/contato#b2b"
            className="inline-flex"
          />
        </div>

      </section>
    </>
  );
}
