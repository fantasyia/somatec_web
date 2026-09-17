import 'server-only';
import { unstable_cache } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('site-settings-runtime');

// =============================================================================
// Loader unificado de site_settings consumido pelo runtime do site público.
//
// O que está na tabela site_settings reflete no <head>, footer, analytics etc.
// O painel /admin saiu em 25/08: quem escreve agora é a sessão do site, direto
// no Supabase.
//
// Cache: unstable_cache com tag 'site_settings' E revalidate de 1h. Depois de
// escrever, ou você espera a hora, ou força na hora:
//
//   POST /api/revalidate?tag=site_settings   (Bearer REVALIDATE_SECRET)
// =============================================================================

export type SeoSettings = {
  title: string | null;
  title_template: string | null;
  description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_handle: string | null;
  google_analytics_id: string | null;
  /** ID do container GTM (GTM-XXXXXXX). Quando existe, é ELE quem carrega tudo. */
  gtm_id: string | null;
  robots_index: boolean | null;
  robots_follow: boolean | null;
};

export type Certification = {
  label: string;
  src: string;
};

/** Fallback quando site_settings.certifications não existe.
 *  Regra (despacho #11): IP-65 é ESPECIFICAÇÃO técnica (datasheet /produtos),
 *  não certificação — nunca entra aqui. ISO 50001 em andamento = só texto,
 *  nunca selo. ISO 9001 não é da Somatec — não usar. */
export const CERTIFICATIONS_FALLBACK: Certification[] = [
  { label: 'ABNT NBR 5410', src: '/certifications/norma.svg' },
  { label: 'IEC 61643-1', src: '/certifications/norma.svg' },
  { label: 'DPS Classe III', src: '/certifications/norma.svg' },
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
  // Sem env de Supabase (build estático/CI): resultado vazio LEGÍTIMO, pode ser
  // cacheado — cai nos fallbacks hardcoded e nada indica erro porque não há.
  if (!hasValidSupabaseConfig()) return {};
  const db = getSupabaseAdminClient();
  const { data, error } = await db
    .from('site_settings')
    .select('key, value')
    .in('key', [...keys]);
  // 🔴 ERRO DO BANCO NÃO PODE VIRAR {} CACHEADO POR 1H. Até 13/09 o `error`
  // era descartado: um timeout do Supabase devolvia {}, o unstable_cache
  // guardava por 3600s, e por uma hora o site inteiro saía com robots noindex
  // (robots_index ?? false), sem GTM (gtm_id null) e com título de fallback —
  // sem nada acusar. Lançar aqui faz o unstable_cache NÃO guardar nada; o
  // `comFallback` do chamador entrega o fallback só nesta requisição, e a
  // próxima tenta o banco de novo.
  if (error) {
    log.error('site_settings: banco indisponível ao ler chaves', { keys }, error);
    throw new Error(`site_settings load falhou: ${error.message}`);
  }
  const rows = (data as unknown as { key: string; value: unknown }[] | null) ?? [];
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<Record<T, unknown>>;
}

/**
 * Executa um getter cacheado e, se ele LANÇAR (banco fora), devolve o fallback
 * só desta requisição — sem deixar o unstable_cache guardar o erro. É o que
 * separa "banco vazio" (cacheável) de "banco fora" (transitório): o vazio
 * retorna normal e é cacheado; o erro sobe até aqui e nunca gruda por 1h.
 */
export async function comFallback<T>(getter: () => Promise<T>, fallback: T, nome: string): Promise<T> {
  try {
    return await getter();
  } catch (err) {
    log.error(`${nome}: usando fallback nesta requisição (não cacheado)`, undefined, err);
    return fallback;
  }
}

/** Fallback de SEO = tudo null → generateMetadata cai nas constantes de SITE.
 *  ⚠️ robots_index null vira `?? false` (noindex) por UMA requisição sob erro,
 *  nunca por 1h. Antes do go-live o site já é noindex; depois, uma requisição
 *  isolada não indexável é infinitamente melhor que uma hora inteira fora. */
export const SEO_FALLBACK: SeoSettings = {
  title: null, title_template: null, description: null, og_title: null,
  og_description: null, og_image: null, twitter_handle: null,
  google_analytics_id: null, gtm_id: null, robots_index: null, robots_follow: null,
};

const SEO_KEYS = [
  'seo_global_title',
  'seo_global_title_template',
  'seo_global_description',
  'seo_og_default_title',
  'seo_og_default_description',
  'seo_og_default_image',
  'seo_twitter_handle',
  'seo_google_analytics_id',
  'seo_gtm_id',
  'seo_robots_index',
  'seo_robots_follow',
] as const;
// COMPANY_KEYS/getCompanyInfo saíram em 07/09/2026. Eram código morto — nada
// no site nem no CMS importava — e o docstring mentia dizendo que o Footer e o
// structured data usavam. Pior: contrariavam a regra do CONTACT em
// lib/constants/site.ts, que proíbe e-mail/telefone/endereço virem do banco
// justamente porque produção já serviu valores velhos por causa disso. A linha
// company_info no site_settings foi apagada junto (guardava "MSM Alimentos").

// ⛔ SOCIAIS NÃO MORAM MAIS AQUI (17/09/2026, decisão do Léo).
//
// Havia `getSocials` lendo `site_settings.socials` com fallback pra env,
// enquanto o JSON-LD lia a env direto. Dois caminhos pro mesmo fato, e arrumar
// um deixava o outro errado SEM SINTOMA — foi assim que o `sameAs` passou
// semanas apontando pra uma página duplicada do LinkedIn.
//
// Agora a fonte é `SOCIALS` em `lib/constants/site.ts`: versionada, revisável
// em commit e coberta por `tests/socials-constante.test.ts`. O CMS nunca
// escreveu a chave `socials` (conferido), então nada operava este caminho.
// Não reintroduzir.

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
      gtm_id: (map['seo_gtm_id'] as string | null) ?? null,
      robots_index: (map['seo_robots_index'] as boolean | null) ?? null,
      robots_follow: (map['seo_robots_follow'] as boolean | null) ?? null,
    };
  },
  ['site-settings:seo'],
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
