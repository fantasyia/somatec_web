import type { Metadata } from 'next';
import { SITE, DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import {
  getHomeHero,
  getIndicators,
  getCtaCards,
} from '@/lib/data/home';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeAterramento } from '@/components/home/HomeAterramento';
import { HomeNaoIndustrial } from '@/components/home/HomeNaoIndustrial';
import { HomeCarroEletrico } from '@/components/home/HomeCarroEletrico';
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
  const [hero, indicators, ctaCards] = await Promise.all([
    getHomeHero(),
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
      {/* Primeira tela = 100svh com SÓ 3 coisas (despacho #7): cabeçalho
          transparente sobreposto + carrossel full-bleed + faixa de logos
          ancorada na base. svh (não vh) por causa da barra do navegador
          mobile. Ritmo de tom segue abaixo da dobra: navy só nas âncoras;
          miolo alterna branco (.tone-surface) ↔ off-white (.tone-base). */}
      <div className="flex h-[100svh] flex-col">
        <HomeHero data={hero} />
        <HomeClients />
      </div>
      {/* Escalada: afirma (manifesto) → quantifica (indicadores) → demonstra
          (gráfico 10 vs 100 kHz) → prova (cases). O "100 kHz" da fileira planta
          o número que o gráfico logo abaixo demonstra. Manifesto+indicadores =
          um único passo de tom. */}
      <div className="tone-base">
        <Reveal><HomeManifesto /></Reveal>
        <HomeIndicators indicators={indicators} />
      </div>
      <div className="tone-surface">
        <HomeFrequency />
      </div>
      <div className="tone-base">
        <HomeProof />
      </div>
      {/* Aterramento dedicado: saiu do carrossel do topo, vira faixa simples. */}
      <div className="tone-surface">
        <HomeAterramento />
      </div>
      <div className="tone-base">
        <HomeNoRisk />
      </div>
      {/* Ponte NI (o que está em risco por público) + aprofundamento EV —
          vizinhos, então tons alternados (despacho #5). */}
      <div className="tone-surface">
        <HomeNaoIndustrial />
      </div>
      <div className="tone-base">
        <HomeCarroEletrico />
      </div>
      {BLOG_TEASER_ENABLED && (
        <div className="tone-surface">
          <Reveal><HomeBlogTeaser /></Reveal>
        </div>
      )}
      {/* Sem o blog teaser, o vizinho de cima é o EV (tone-base) — alterna. */}
      <div className={BLOG_TEASER_ENABLED ? 'tone-base' : 'tone-surface'}>
        <Reveal><HomeCta cards={ctaCards} /></Reveal>
      </div>
    </>
  );
}