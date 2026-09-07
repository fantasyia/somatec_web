import type { Metadata } from 'next';
import { SITE } from '@/lib/constants/site';
import { getHomeHero, getIndicators } from '@/lib/data/home';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeAterramento } from '@/components/home/HomeAterramento';
import { HomeHoraParada } from '@/components/home/HomeHoraParada';
import { HomeNiPaineis } from '@/components/home/HomeNiPaineis';
import { HomeBifurcacao } from '@/components/home/HomeBifurcacao';
import { HomeIndicators } from '@/components/home/HomeIndicators';
import { HomeFrequency } from '@/components/home/HomeFrequency';
import { HomeClients } from '@/components/home/HomeClients';
import { HomeProof } from '@/components/home/HomeProof';
import { HomeSetores } from '@/components/home/HomeSetores';
import { HomePonteMedido } from '@/components/home/HomePonteMedido';
import { HomeNoRisk } from '@/components/home/HomeNoRisk';
import { HomeBlogTeaser } from '@/components/home/HomeBlogTeaser';
import { BLOG_TEASER_ENABLED } from '@/lib/constants/flags';
import { JsonLd } from '@/components/seo/JsonLd';
import { Reveal } from '@/components/ui/Reveal';
import { organizationSchema, masterBlockProductSchema, faqSchema } from '@/lib/seo/structured-data';

/**
 * A home NÃO declara `openGraph`, `twitter` nem `description` de propósito.
 *
 * Ela herda o layout raiz, que lê `seo_og_default_title`,
 * `seo_og_default_description` e `seo_global_description` de `site_settings`
 * no Supabase. É isso que permite trocar a copy do card de compartilhamento
 * sem deploy.
 *
 * ⚠️ Até 07/09 a home cravava aqui `${SITE.fullName} — ${SITE.description}`
 * como og:title — 150 caracteres, o nome da empresa mais a descrição inteira
 * colada. Em Next, `openGraph` de página SUBSTITUI o do layout (não há
 * deep-merge), então a home vencia o banco e a copy nova simplesmente não
 * aparecia. E não dava erro: as duas chaves gravavam, a revalidação
 * respondia ok, e o card continuava velho.
 *
 * O `title` fica: "Somatec Blocking" é melhor que o default longo do layout.
 */
export const metadata: Metadata = {
  title: SITE.fullName,
  alternates: { canonical: '/' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
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
          miolo alterna branco (.tone-surface) ↔ off-white (.tone-base).

          TETO PROPORCIONAL À LARGURA: as fotos do hero são 1920×1010 (aspecto
          1,90) e cobrem o espaço com object-cover. Em monitor ALTO — retrato,
          4:3 — o hero ficava quase quadrado e a foto era ampliada até 2×,
          mostrando só METADE da largura (medido em 1780×1990: 50% visível,
          zoom 1,99×).

          O teto é `62vw` porque o que quebra a foto é o ASPECTO da caixa, não
          a altura em px: limitando a altura a 62% da largura, a caixa nunca
          fica mais estreita que ~1,6:1 e a lateral da foto nunca sai. Teto fixo
          em px não serve — testei 820px e encolhia o hero nas telas normais
          (1920×1080 caía de 950 pra 690).

          O `max(560px, …)` é o piso, pra tablet em pé não virar uma tira.
          Em tela de proporção normal o `min()` não age e a primeira tela
          continua exatamente 100svh, como o despacho #7 pede. No mobile fica
          100svh puro: lá a foto é retrato e a regra não se aplica. */}
      <div className="flex h-[100svh] md:h-[min(100svh,max(560px,62vw))] flex-col">
        <HomeHero data={hero} />
        <HomeClients />
      </div>
      {/* ⭐ BIFURCAÇÃO (despacho #15): logo após os logos, a home declara os
          2 públicos e os 2 modelos (indústria=locação · NI=compra direta). */}
      <div id="bifurcacao" className="tone-base scroll-mt-20">
        <HomeBifurcacao />
      </div>
      {/* Argumento universal em banda navy: gráfico 10 vs 100 kHz + a fileira
          de indicadores que o quantifica. */}
      <div className="band-navy">
        <HomeFrequency />
        <HomeIndicators indicators={indicators} />
      </div>
      {/* Trilha industrial (âncora do card A da bifurcação). A faixa full-bleed
          do galpão saiu — a ponte contida logo abaixo já traz a imagem. */}
      <div id="industria" className="tone-surface scroll-mt-20">
        <HomeProof />
      </div>
      {/* Faixa-ponte navy contida (2 colunas com card de imagem): "isso
          funciona" → "isso funcionou de verdade". Entre HomeProof (claro) e os
          cases (off-white) — navy sem colar dois navy. */}
      <HomePonteMedido />
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
      {/* Lead magnet industrial (#16-G, banda NAVY espelhando o gráfico do
          DPS): vizinhos claros dos dois lados (NoRisk ⚪ · Aterramento ⚪). */}
      <HomeHoraParada />
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