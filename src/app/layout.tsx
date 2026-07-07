import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Source_Sans_3, Poppins } from 'next/font/google';
import { unstable_cache } from 'next/cache';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CookieBanner, type CookieBannerText } from '@/components/layout/CookieBanner';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { PublicOnly } from '@/components/layout/PublicOnly';
import { SITE } from '@/lib/constants/site';
import { FOOTER_COLUMNS } from '@/lib/constants/navigation';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getWhatsAppButtonConfig, buildWhatsAppUrl } from '@/lib/whatsapp-button';
import { getSeoSettings, getSocials, getCertifications } from '@/lib/data/site-settings';

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F8FB' },
    { media: '(prefers-color-scheme: dark)', color: '#002B47' },
  ],
  width: 'device-width',
  initialScale: 1,
};

function safeUrl(url: string, fallback = 'https://somatecblocking.com.br') {
  try { return new URL(url); } catch { return new URL(fallback); }
}

/**
 * Metadata gerado dinamicamente — lê de site_settings (editável em
 * /admin/seo) com fallback para constantes em lib/constants/site.ts.
 * Cache via unstable_cache no loader; invalida quando admin salva.
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
  const [cookieBannerText, footerColumns, whatsAppConfig, socials, seo, certifications] = await Promise.all([
    getCookieBannerText(),
    getFooterData(),
    getWhatsAppButtonConfig(),
    getSocials(),
    getSeoSettings(),
    getCertifications(),
  ]);
  const whatsAppUrl = buildWhatsAppUrl(whatsAppConfig);
  const gaId = seo.google_analytics_id;
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          {/* Skip link for keyboard navigation */}
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold focus:text-deep_navy focus:rounded-btn focus:font-semibold"
          >
            Pular para o conteúdo principal
          </a>
          <PublicOnly>
            <Header />
          </PublicOnly>
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <PublicOnly>
            <Footer columns={footerColumns} socials={socials} certifications={certifications} />
            <CookieBanner text={cookieBannerText} />
            {whatsAppUrl && <WhatsAppButton href={whatsAppUrl} />}
          </PublicOnly>
        </ThemeProvider>

        {/* Google Analytics — só carrega quando admin cadastrou GA ID em
            /admin/seo. Usa strategy=afterInteractive (não bloqueia LCP). */}
        {gaId && (
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
      </body>
    </html>
  );
}
