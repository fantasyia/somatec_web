import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Brand } from '@/types/database';

export const metadata: Metadata = {
  title: 'Marcas — MSM Indústria',
  description:
    'Conheça as marcas desenvolvidas e produzidas pela MSM Indústria — identidade própria, qualidade industrial e consistência de fornecimento para o mercado alimentício.',
  alternates: { canonical: '/marcas' },
  openGraph: {
    title: 'Marcas — MSM Indústria',
    description:
      'Conheça as marcas desenvolvidas e produzidas pela MSM Indústria — identidade própria, qualidade industrial e consistência de fornecimento para o mercado alimentício.',
    url: '/marcas',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

type BrandCard = Pick<Brand, 'id' | 'name' | 'slug' | 'short_description' | 'logo_url' | 'categories' | 'featured'>;

export default async function MarcasPage() {
  const db = await getSupabaseServerClient();
  const { data: rawBrands } = await db
    .from('brands')
    .select('id, name, slug, short_description, logo_url, categories, featured')
    .eq('status', 'published')
    .order('display_order');

  const list = (rawBrands as unknown as BrandCard[] | null) ?? [];

  return (
    <>
      <PageHero
        eyebrow="Portfólio"
        title="Nossas marcas"
        description="Marcas desenvolvidas com padrão industrial MSM — identidade, qualidade e consistência para o mercado alimentício."
        breadcrumbs={[{ label: 'Marcas' }]}
      />

      <section className="container-msm py-10 md:py-14">
        {list.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {list.map((brand: BrandCard) => (
              <Link
                key={brand.id}
                href={`/marcas/${brand.slug}`}
                className="group flex flex-col gap-4 p-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-all duration-[250ms] ease-premium hover:-translate-y-0.5 hover:border-gold hover:shadow-premium-light dark:hover:shadow-premium-dark"
              >
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={`Logo ${brand.name}`}
                    width={120}
                    height={48}
                    className="h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="h-10 w-24 rounded bg-[rgb(var(--border))] flex items-center justify-center">
                    <span className="text-xs text-[rgb(var(--text-muted))] font-sans font-semibold">{brand.name}</span>
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  <h2 className="font-sans font-semibold text-lg text-[rgb(var(--text))]">{brand.name}</h2>
                  {brand.short_description && (
                    <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))] line-clamp-2">
                      {brand.short_description}
                    </p>
                  )}
                  {brand.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {brand.categories.slice(0, 3).map((cat) => (
                        <span key={cat} className="inline-block px-2 py-0.5 rounded text-[11px] font-sans font-semibold uppercase tracking-wide border border-[rgb(var(--border))] text-[rgb(var(--text-muted))]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-sans font-semibold text-gold">
                  Conhecer marca
                  <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 ease-premium group-hover:translate-x-1" strokeWidth={2} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
            <span className="eyebrow">Portfólio</span>
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Portfólio de marcas em publicação
            </h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Nosso portfólio de marcas está sendo publicado. Em breve você poderá conhecer todas as marcas desenvolvidas e gerenciadas pela MSM.
            </p>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Para informações sobre marcas disponíveis, entre em contato com nossa equipe comercial.
            </p>
            <CommercialCta
              label="Falar com a equipe"
              fallbackPath="/contato#b2b"
              className="inline-flex mt-2"
            />
          </div>
        )}
      </section>
    </>
  );
}
