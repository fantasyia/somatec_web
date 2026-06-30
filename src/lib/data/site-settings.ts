import 'server-only';
import { unstable_cache } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('site-settings-runtime');

// =============================================================================
// Loader unificado de site_settings consumido pelo runtime do site público.
//
// Mantém o admin (BLOCO F) com efeito real: o que você edita em
// /admin/configuracoes e /admin/seo passa a refletir no <head>, footer,
// analytics, etc.
//
// Cache: unstable_cache com tag 'site_settings' — invalida quando o admin
// salva (já é o caso em /api/admin/settings/route.ts).
// =============================================================================

export type Socials = {
  linkedin: string | null;
  instagram: string | null;
  youtube: string | null;
};

export type SeoSettings = {
  title: string | null;
  title_template: string | null;
  description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_handle: string | null;
  google_analytics_id: string | null;
  robots_index: boolean | null;
  robots_follow: boolean | null;
};

export type CompanyInfo = {
  legal_name: string | null;
  cnpj: string | null;
  address: string | null;
  email: string | null;
  whatsapp: string | null;
};

export type Certification = {
  label: string;
  src: string;
};

/** Fallback quando site_settings.certifications não existe. */
export const CERTIFICATIONS_FALLBACK: Certification[] = [
  { label: 'ABNT NBR 5410', src: '/certifications/norma.svg' },
  { label: 'IEC 61643-1', src: '/certifications/norma.svg' },
  { label: 'DPS Classe III', src: '/certifications/norma.svg' },
  { label: 'IP-65', src: '/certifications/norma.svg' },
];

function hasValidSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') && url.includes('.supabase.');
}

/**
 * Lê várias keys de site_settings em uma query única (whitelist).
 * Retorna mapa { key → value }.
 */
async function loadKeys<T extends string>(keys: readonly T[]): Promise<Partial<Record<T, unknown>>> {
  if (!hasValidSupabaseConfig()) return {};
  try {
    const db = getSupabaseAdminClient();
    const { data } = await db
      .from('site_settings')
      .select('key, value')
      .in('key', [...keys]);
    const rows = (data as unknown as { key: string; value: unknown }[] | null) ?? [];
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<Record<T, unknown>>;
  } catch (err) {
    log.warn('loadKeys failed', { keys }, err);
    return {};
  }
}

const SOCIALS_KEYS = ['socials'] as const;
const SEO_KEYS = [
  'seo_global_title',
  'seo_global_title_template',
  'seo_global_description',
  'seo_og_default_title',
  'seo_og_default_description',
  'seo_og_default_image',
  'seo_twitter_handle',
  'seo_google_analytics_id',
  'seo_robots_index',
  'seo_robots_follow',
] as const;
const COMPANY_KEYS = ['company_info'] as const;

/** Sociais — usado pelo Footer. Fallback pra env vars (constantes). */
export const getSocials = unstable_cache(
  async (): Promise<Socials> => {
    const map = await loadKeys(SOCIALS_KEYS);
    const raw = (map['socials'] as Partial<Socials> | null) ?? null;
    return {
      linkedin: raw?.linkedin ?? process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? null,
      instagram: raw?.instagram ?? process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? null,
      youtube: raw?.youtube ?? process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? null,
    };
  },
  ['site-settings:socials'],
  { revalidate: 3600, tags: ['site_settings'] },
);

/** SEO globais — usado pelo RootLayout. Cada campo tem fallback hardcoded. */
export const getSeoSettings = unstable_cache(
  async (): Promise<SeoSettings> => {
    const map = await loadKeys(SEO_KEYS);
    return {
      title: (map['seo_global_title'] as string | null) ?? null,
      title_template: (map['seo_global_title_template'] as string | null) ?? null,
      description: (map['seo_global_description'] as string | null) ?? null,
      og_title: (map['seo_og_default_title'] as string | null) ?? null,
      og_description: (map['seo_og_default_description'] as string | null) ?? null,
      og_image: (map['seo_og_default_image'] as string | null) ?? null,
      twitter_handle: (map['seo_twitter_handle'] as string | null) ?? null,
      google_analytics_id: (map['seo_google_analytics_id'] as string | null) ?? null,
      robots_index: (map['seo_robots_index'] as boolean | null) ?? null,
      robots_follow: (map['seo_robots_follow'] as boolean | null) ?? null,
    };
  },
  ['site-settings:seo'],
  { revalidate: 3600, tags: ['site_settings'] },
);

/** Empresa — usado em address/email/phone do Footer e structured data. */
export const getCompanyInfo = unstable_cache(
  async (): Promise<CompanyInfo> => {
    const map = await loadKeys(COMPANY_KEYS);
    const raw = (map['company_info'] as Partial<CompanyInfo> | null) ?? null;
    return {
      legal_name: raw?.legal_name ?? null,
      cnpj: raw?.cnpj ?? null,
      address: raw?.address ?? null,
      email: raw?.email ?? null,
      whatsapp: raw?.whatsapp ?? null,
    };
  },
  ['site-settings:company'],
  { revalidate: 3600, tags: ['site_settings'] },
);

/** Certificações — usado pelo Footer. Fallback pros 4 placeholders. */
export const getCertifications = unstable_cache(
  async (): Promise<Certification[]> => {
    const map = await loadKeys(['certifications'] as const);
    const raw = map['certifications'] as unknown;
    if (!Array.isArray(raw) || raw.length === 0) return CERTIFICATIONS_FALLBACK;
    // Sanitiza: só itens com label + src strings.
    const valid = raw.filter(
      (c): c is Certification =>
        typeof c === 'object' && c !== null &&
        typeof (c as Certification).label === 'string' &&
        typeof (c as Certification).src === 'string' &&
        (c as Certification).label.length > 0 &&
        (c as Certification).src.length > 0,
    );
    return valid.length > 0 ? valid : CERTIFICATIONS_FALLBACK;
  },
  ['site-settings:certifications'],
  { revalidate: 3600, tags: ['site_settings'] },
);
