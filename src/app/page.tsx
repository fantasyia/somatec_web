import type { Metadata } from 'next';
import { SITE, DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { getHomeHero, getIndicators } from '@/lib/data/home';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeAterramento } from '@/components/home/HomeAterramento';
import { HomeHoraParada } from '@/components/home/HomeHoraParada';
import { HomeNiPaineis } from '@/components/home/HomeNiPaineis';
import Image from 'next/image';
import { HomeBifurcacao } from '@/components/home/HomeBifurcacao';
import { HomeIndicators } from '@/components/home/HomeIndicators';
import { HomeFrequency } from '@/components/home/HomeFrequency';
import { HomeClients } from '@/components/home/HomeClients';
import { HomeProof } from '@/components/home/HomeProof';
import { HomeSetores } from '@/components/home/HomeSetores';
import { HomeNoRisk } from '@/components/home/HomeNoRisk';
import { HomeBlogTeaser } from '@/components/home/HomeBlogTeaser';
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
  const [hero, indicators] = await Promise.all([
    getHomeHero(),
    getIndicators(),
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
      {/* Trilha industrial (âncora do card A da bifurcação). */}
      <div id="industria" className="tone-surface scroll-mt-20">
        <HomeProof />
        {/* Faixa de transição industrial (despacho + 2 correções): ESTÁTICA
            (banda fina se mexendo distrai — motion fica nos gráficos) e com
            MAIS altura + webp q92 / quality 90 pra não degradar a fonte. */}
        <div className="relative h-[320px] w-full overflow-hidden md:h-[440px]">
          <Image
            src="/home/faixa-industrial-top.webp"
            alt="Planta industrial em operação ao anoitecer"
            fill
            loading="lazy"
            quality={90}
            sizes="100vw"
            className="object-cover object-[center_62%]"
          />
        </div>
      </div>
      {/* FUSÃO (adendo #16): cases + segmentos viram UMA seção — "Resultado
          real, setor por setor" (4 setores: foto + dor + prova + CTA), com a
          linha de clientes e a faixa de selos. A antiga seção de segmentos do
          fim foi absorvida aqui. */}
      <div className="tone-base">
        <HomeSetores />
      </div>
      {/* Modelo industrial explícito (rótulo Locação · Indústria, timeline). */}
      <div className="tone-surface">
        <HomeNoRisk />
      </div>
      {/* Lead magnet industrial (#16-G): custo da hora parada. */}
      <div className="tone-base">
        <HomeHoraParada />
      </div>
      <div className="tone-surface">
        <HomeAterramento />
      </div>
      {/* Módulo NI (#16-H + adendo): 3 painéis de foto → /protecao. */}
      <div className="tone-base">
        <HomeNiPaineis />
      </div>
      {BLOG_TEASER_ENABLED && (
        <div className="tone-surface">
          <Reveal><HomeBlogTeaser /></Reveal>
        </div>
      )}
    </>
  );
}