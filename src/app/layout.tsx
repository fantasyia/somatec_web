import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { CONSENT_DEFAULT_SNIPPET } from '@/lib/consent';
import { TRAFEGO_INTERNO_SNIPPET } from '@/lib/analytics/trafego-interno';
import { Source_Sans_3, Poppins } from 'next/font/google';
import { unstable_cache } from 'next/cache';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { lerSlugsNi } from '@/lib/blog/fonte';
import { Footer } from '@/components/layout/Footer';
import { CookieBanner, type CookieBannerText } from '@/components/layout/CookieBanner';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { StickyCta } from '@/components/layout/StickyCta';
import { SITE } from '@/lib/constants/site';
import { FOOTER_COLUMNS } from '@/lib/constants/navigation';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getWhatsAppButtonConfig, buildWhatsAppUrl } from '@/lib/whatsapp-button';
import { getSeoSettings, getSocials, getCertifications } from '@/lib/data/site-settings';
import { AttributionTracker } from '@/components/AttributionTracker';

// Texto corrido — Source Sans Pro (brandbook Somatec). Var mantém o nome
// legado --font-inter para não tocar o tailwind/html.
const inter = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

// Títulos — Poppins (grotesca geométrica arredondada e encorpada, x-height
// baixo — o substituto grátis mais próximo do Brandon Grotesque do brandbook,
// que é fonte paga). Var mantém o nome legado --font-fraunces.
const fraunces = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const viewport: Viewport = {
  // Tema único claro — sem variação por prefers-color-scheme.
  themeColor: '#F5F8FB',
  width: 'device-width',
  initialScale: 1,
};

function safeUrl(url: string, fallback = 'https://www.somatecblocking.com.br') {
  try { return new URL(url); } catch { return new URL(fallback); }
}

/**
 * Metadata gerado dinamicamente — lê de site_settings (escrito direto no
 * Supabase pela sessão do site) com fallback para constantes em
 * lib/constants/site.ts. Cache via unstable_cache no loader (revalidate 1h);
 * pra valer na hora: POST /api/revalidate?tag=site_settings.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  const title = seo.title ?? `${SITE.fullName} — ${SITE.description}`;
  const titleTemplate = seo.title_template ?? `%s · ${SITE.fullName}`;
  const description = seo.description ?? SITE.description;
  const ogTitle = seo.og_title ?? title;
  const ogDescription = seo.og_description ?? description;
  const ogImage = seo.og_image ?? SITE.ogImage;

  return {
    metadataBase: safeUrl(SITE.url),
    title: { default: title, template: titleTemplate },
    description,
    applicationName: SITE.fullName,
    authors: [{ name: SITE.fullName }],
    generator: 'Next.js',
    robots: {
      // Defaults globais — páginas individuais sobrescrevem via robots_index/follow.
      // null em site_settings → mantém defaults seguros (index:false, follow:true).
      index: seo.robots_index ?? false,
      follow: seo.robots_follow ?? true,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: SITE.url,
      siteName: SITE.fullName,
      locale: SITE.locale,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE.fullName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
      ...(seo.twitter_handle ? { site: seo.twitter_handle, creator: seo.twitter_handle } : {}),
    },
  };
}

type FooterLink = { label: string; href: string };
type FooterColumnData = { title: string; links: FooterLink[] };

function hasValidSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') && url.includes('.supabase.');
}

const getFooterData = unstable_cache(
  async (): Promise<FooterColumnData[]> => {
    if (!hasValidSupabaseConfig()) return FOOTER_COLUMNS;
    try {
      const db = getSupabaseAdminClient();
      const [{ data: cols }, { data: lnks }] = await Promise.all([
        db.from('footer_columns').select('id, title, display_order').eq('active', true).order('display_order'),
        db.from('footer_links').select('label, href, column_id, display_order').eq('active', true).order('display_order'),
      ]);
      const columns = cols as unknown as { id: string; title: string }[] | null;
      const links = lnks as unknown as { label: string; href: string; column_id: string }[] | null;
      if (!columns?.length) return FOOTER_COLUMNS;
      return columns.map((col) => ({
        title: col.title,
        links: (links ?? []).filter((l) => l.column_id === col.id),
      }));
    } catch {
      return FOOTER_COLUMNS;
    }
  },
  ['footer-data'],
  { revalidate: 3600, tags: ['footer'] },
);

const getCookieBannerText = unstable_cache(
  async (): Promise<CookieBannerText | undefined> => {
    if (!hasValidSupabaseConfig()) return undefined;
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'cookie_banner_text')
        .maybeSingle();
      const row = data as unknown as { value: CookieBannerText } | null;
      return row?.value ?? undefined;
    } catch {
      return undefined;
    }
  },
  ['cookie-banner-text'],
  { revalidate: 3600, tags: ['site_settings'] },
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cookieBannerText, footerColumns, whatsAppConfig, socials, seo, certifications, slugsNi] =
    await Promise.all([
      getCookieBannerText(),
      getFooterData(),
      getWhatsAppButtonConfig(),
      getSocials(),
      getSeoSettings(),
      getCertifications(),
      // O menu e o rodapé escondem ferramenta industrial nas rotas NI. Eles são
      // client components e não sabem o que o CMS publicou — quem sabe é aqui.
      lerSlugsNi(),
    ]);
  const whatsAppUrl = buildWhatsAppUrl(whatsAppConfig);
  const gaId = seo.google_analytics_id;
  // ⚖️ GTM manda (decisão do Léo, 08/09): existindo container, GA4 e Pixel
  // entram POR DENTRO dele. O gtag direto vira fallback e é ignorado aqui —
  // carregar os dois faria o GA contar cada pageview duas vezes.
  const gtmId = seo.gtm_id;
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        {/* ⚖️ CONSENT MODE v2 — declara o consentimento ANTES de qualquer tag.
            Sem isto, bastava existir um ID no banco pro GA subir pra todo
            mundo, inclusive pra quem clicou "Apenas essenciais" (LGPD, e mudo:
            nenhum erro aparecia). `beforeInteractive` garante a ordem — o
            `default` tem que chegar antes do container, depois já disparou.
            Texto único em `@/lib/consent`. */}
        <Script id="consent-default" strategy="beforeInteractive">
          {CONSENT_DEFAULT_SNIPPET}
        </Script>
        {/* 🏷️ TRÁFEGO INTERNO — marca a visita de teste antes do container.
            Tem que ser `beforeInteractive`: o `page_view` sai quando o GTM
            carrega, e o componente React que marca nas trocas de rota só existe
            depois da hidratação. Detalhe do porquê em `@/lib/analytics/trafego-interno`. */}
        <Script id="trafego-interno" strategy="beforeInteractive">
          {TRAFEGO_INTERNO_SNIPPET}
        </Script>
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        {/* Skip link for keyboard navigation */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold focus:text-deep_navy focus:rounded-btn focus:font-semibold"
        >
          Pular para o conteúdo principal
        </a>
        {/* Captura de atribuição (UTM/gclid/fbclid) na chegada — cookie funcional. */}
        <AttributionTracker />
        <Header slugsNi={slugsNi} />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer columns={footerColumns} socials={socials} certifications={certifications} slugsNi={slugsNi} />
        <CookieBanner text={cookieBannerText} />
        {whatsAppUrl && <WhatsAppButton href={whatsAppUrl} />}
        <StickyCta />

        {/* Google Analytics — fallback pra quando NÃO existe container GTM.
            Só carrega com GA ID em site_settings (escrito direto no Supabase;
            o painel saiu em 25/08) e afterInteractive, pra não bloquear o LCP.
            Respeita o Consent Mode declarado no <head>. */}
        {!gtmId && gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaId)}, { anonymize_ip: true });`}
            </Script>
          </>
        )}
        {/* Google Tag Manager — o container centraliza GA4, Pixel e o que vier.
            Sobe DEPOIS do Consent Mode declarado no <head>: sem essa ordem, a
            tag dispara antes de saber se pode. */}
        {gtmId && (
          <Script id="gtm" strategy="afterInteractive">
            {`window.__somatecGTM=true;(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`}
          </Script>
        )}
      </body>
    </html>
  );
}
