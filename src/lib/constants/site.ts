export const SITE = {
  name: 'Somatec',
  fullName: 'Somatec Blocking',
  description:
    'Proteção contra surtos e qualidade de energia para a indústria. MasterBlock — supressor com atuação em 100 kHz.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://somatecblocking.com.br',
  locale: 'pt-BR',
  ogImage: '/og-default.jpg',
} as const;

/** Array images padrão pra usar em metadata.openGraph.images quando uma página
 * sobrescreve openGraph completo (Next.js não faz deep-merge). */
export const DEFAULT_OG_IMAGES = [
  { url: SITE.ogImage, width: 1200, height: 630, alt: SITE.fullName },
] as const;

export const CONTACT = {
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'somatec@somatecblocking.com.br',
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? '',
} as const;

export const SOCIALS = {
  linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? '',
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? '',
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? '',
} as const;
