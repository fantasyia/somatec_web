import type { Metadata } from 'next';
import { SITE, DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import {
  getHomeHero,
  getSliderItems,
  getIndicators,
  getCtaCards,
  getFeaturedBrands,
  getFeaturedProducts,
  getFeaturedRecipes,
} from '@/lib/data/home';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  BRANDS_FALLBACK,
  PRODUCTS_FALLBACK,
  RECIPES_FALLBACK,
} from '@/lib/constants/home-fallback';
import type { Brand, Product, Recipe } from '@/types/database';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeCarousel } from '@/components/home/HomeCarousel';
import { HomeIndicators } from '@/components/home/HomeIndicators';
import { HomeManifesto } from '@/components/home/HomeManifesto';
import { HomeBrands } from '@/components/home/HomeBrands';
import { HomeProducts } from '@/components/home/HomeProducts';
import { HomeRecipes } from '@/components/home/HomeRecipes';
import { HomeBlogTeaser } from '@/components/home/HomeBlogTeaser';
import { HomeCta } from '@/components/home/HomeCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { Reveal } from '@/components/ui/Reveal';
import { organizationSchema, masterBlockProductSchema, faqSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: SITE.fullName,
  description: SITE.description,
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
  openGraph: {
    title: `${SITE.fullName} — ${SITE.description}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.fullName,
    locale: SITE.locale,
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.fullName} — ${SITE.description}`,
    description: SITE.description,
    images: [SITE.ogImage],
  },
};

// ISR — revalidação on-demand (Fase 7 conecta /api/revalidate).
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch paralelo de todos os blocos.
  const [hero, sliderItems, indicators, ctaCards, brands, products, recipes] =
    await Promise.all([
      getHomeHero(),
      getSliderItems(),
      getIndicators(),
      getCtaCards(),
      getFeaturedBrands(),
      getFeaturedProducts(),
      getFeaturedRecipes(),
    ]);

  const displayBrands = brands.length > 0 ? brands : (BRANDS_FALLBACK as unknown as Brand[]);
  const displayProducts = products.length > 0 ? products : (PRODUCTS_FALLBACK as unknown as Product[]);
  const displayRecipes = recipes.length > 0 ? recipes : (RECIPES_FALLBACK as unknown as Recipe[]);

  // Map de brand_id → name para uso nos cards de produtos
  let brandNames: Record<string, string> = {};
  if (products.length > 0) {
    const ids = Array.from(new Set(products.map((p) => p.brand_id).filter(Boolean) as string[]));
    if (ids.length > 0) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data } = await supabase.from('brands').select('id, name').in('id', ids);
        const rows = (data ?? []) as { id: string; name: string }[];
        brandNames = Object.fromEntries(rows.map((b) => [b.id, b.name]));
      } catch {
        // ignore
      }
    }
  } else {
    brandNames = Object.fromEntries(BRANDS_FALLBACK.map((b) => [b.id, b.name]));
  }

  return (
    <>
      {/* Structured data (Schema.org) — Organization + Product (MasterBlock) + FAQ (SEO/GEO) */}
      <JsonLd data={[organizationSchema(), masterBlockProductSchema(), faqSchema()]} />

      {/* Hero e carrossel: render imediato (acima da dobra). Demais seções
          entram com fade-up ao scroll (§20.14). HomeIndicators tem stagger
          interno próprio entre os indicadores. */}
      <HomeHero data={hero} />
      <HomeCarousel items={sliderItems} />
      <Reveal><HomeManifesto /></Reveal>
      <HomeIndicators indicators={indicators} />
      <Reveal><HomeProducts products={displayProducts} brandNames={brandNames} /></Reveal>
      <Reveal><HomeBlogTeaser /></Reveal>
      <Reveal><HomeCta cards={ctaCards} /></Reveal>
    </>
  );
}