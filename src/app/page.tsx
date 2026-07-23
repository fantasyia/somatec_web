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
import Image from 'next/image';
import { HomeBifurcacao } from '@/components/home/HomeBifurcacao';
import { HomeIndicators } from '@/components/home/HomeIndicators';
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
      {/* ⭐ BIFURCAÇÃO (despacho #15): logo após os logos, a home declara os
          2 públicos e os 2 modelos (indústria=locação · NI=compra direta). */}
      <div className="tone-base">
        <HomeBifurcacao />
      </div>
      {/* Argumento universal em banda navy: gráfico 10 vs 100 kHz + a fileira
          de indicadores que o quantifica. */}
      <div className="band-navy">
        <HomeFrequency />
        <HomeIndicators indicators={indicators} />
      </div>
      {/* Trilha industrial (âncora do card A da bifurcação): faixa full-width
          de FOTO de produção — quebra o "técnico demais" antes dos cases. */}
      <div id="industria" className="tone-surface scroll-mt-20">
        <div className="relative h-[260px] w-full overflow-hidden md:h-[360px]">
          <Image
            src="/home/hero/hero-s2b-wide.webp"
            alt="Linha de produção industrial com painel de proteção Master Block"
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <HomeProof />
      </div>
      {/* Modelo industrial explícito (rótulo Locação · Indústria). */}
      <div className="tone-base">
        <HomeNoRisk />
      </div>
      {/* Trilha NI SUBIDA do rodapé (despacho #15): bloco-ponte (compra
          direta) + carro elétrico, colados na trilha industrial — os 2
          modelos lado a lado. CTAs → /protecao (hub NI). */}
      <div className="tone-surface">
        <HomeNaoIndustrial />
        <HomeCarroEletrico />
      </div>
      <div className="tone-base">
        <HomeAterramento />
      </div>
      <div className="tone-surface">
        <Reveal><HomeCta cards={ctaCards} /></Reveal>
      </div>
      {BLOG_TEASER_ENABLED && (
        <div className="tone-base">
          <Reveal><HomeBlogTeaser /></Reveal>
        </div>
      )}
    </>
  );
}