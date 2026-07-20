import type { Metadata } from 'next';
import { SITE, DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import {
  getHomeHero,
  getSliderItems,
  getIndicators,
  getCtaCards,
} from '@/lib/data/home';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeCarousel } from '@/components/home/HomeCarousel';
import { HomeIndicators } from '@/components/home/HomeIndicators';
import { HomeManifesto } from '@/components/home/HomeManifesto';
import { HomeFrequency } from '@/components/home/HomeFrequency';
import { HomeClients } from '@/components/home/HomeClients';
import { HomeProof } from '@/components/home/HomeProof';
import { HomeNoRisk } from '@/components/home/HomeNoRisk';
import { HomeBlogTeaser } from '@/components/home/HomeBlogTeaser';
import { HomeCta } from '@/components/home/HomeCta';
import { BLOG_TEASER_ENABLED } from '@/lib/constants/flags';
import { JsonLd } from '@/components/seo/JsonLd';
import { Reveal } from '@/components/ui/Reveal';
import { organizationSchema, masterBlockProductSchema, faqSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: SITE.fullName,
  description: SITE.description,
  alternates: { canonical: '/' },
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
  const [hero, sliderItems, indicators, ctaCards] = await Promise.all([
    getHomeHero(),
    getSliderItems(),
    getIndicators(),
    getCtaCards(),
  ]);

  return (
    <>
      {/* Structured data (Schema.org) — Organization + Product (MasterBlock) + FAQ (SEO/GEO) */}
      <JsonLd data={[organizationSchema(), masterBlockProductSchema(), faqSchema()]} />

      {/* Hero e carrossel: render imediato (acima da dobra). Demais seções
          entram com fade-up ao scroll (§20.14). HomeIndicators tem stagger
          interno próprio entre os indicadores. */}
      {/* Ritmo de tom (TESTE): navy só nas âncoras (hero + footer); o miolo
          alterna branco (.tone-surface) ↔ off-white (.tone-base), theme-aware,
          nunca dois vizinhos iguais. Separação por TOM, sem device de sombra.
          Exceção: a faixa de logos segue navy (assets são logos brancos) e
          forma, junto do hero, a âncora de topo. */}
      <HomeHero data={hero} />
      <HomeClients />
      <div className="tone-base">
        <HomeCarousel items={sliderItems} />
      </div>
      {/* Escalada: afirma (manifesto) → quantifica (indicadores) → demonstra
          (gráfico 10 vs 100 kHz) → prova (cases). O "100 kHz" da fileira planta
          o número que o gráfico logo abaixo demonstra. Manifesto+indicadores =
          um único passo branco. */}
      <div className="tone-surface">
        <Reveal><HomeManifesto /></Reveal>
        <HomeIndicators indicators={indicators} />
      </div>
      <div className="tone-base">
        <HomeFrequency />
      </div>
      <div className="tone-surface">
        <HomeProof />
      </div>
      <div className="tone-base">
        <HomeNoRisk />
      </div>
      {BLOG_TEASER_ENABLED && (
        <div className="tone-surface">
          <Reveal><HomeBlogTeaser /></Reveal>
        </div>
      )}
      <div className="tone-base">
        <Reveal><HomeCta cards={ctaCards} /></Reveal>
      </div>
    </>
  );
}