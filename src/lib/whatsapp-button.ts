import 'server-only';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('whatsapp-button');

// =============================================================================
// Configuração do botão WhatsApp flutuante.
//
// Chave persistente: site_settings['whatsapp_button']
// Lido no root layout via unstable_cache (tag: 'whatsapp_button').
// Atualizado via /admin/whatsapp → revalidateTag('whatsapp_button').
// =============================================================================

export const whatsAppButtonSchema = z.object({
  enabled: z.boolean(),
  // Aceita só dígitos (E.164 sem +). 10-15 dígitos cobre BR/MX/EUA/UE.
  number: z.string().regex(/^[0-9]*$/, 'Apenas dígitos (sem +, traço ou espaço)').max(15),
  message: z.string().max(500),
});

export type WhatsAppButtonConfig = z.infer<typeof whatsAppButtonSchema>;

export const WHATSAPP_BUTTON_DEFAULT: WhatsAppButtonConfig = {
  enabled: false,
  number: '',
  message: 'Olá! Vim pelo site da MSM e gostaria de saber mais.',
};

function hasValidSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') && url.includes('.supabase.');
}

/**
 * Lê a config do WhatsApp button. Falha silenciosa retorna default (button off).
 * Cached por tag — invalidação via revalidateTag('whatsapp_button') após save.
 */
export const getWhatsAppButtonConfig = unstable_cache(
  async (): Promise<WhatsAppButtonConfig> => {
    if (!hasValidSupabaseConfig()) return WHATSAPP_BUTTON_DEFAULT;
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_button')
        .maybeSingle();
      const row = data as unknown as { value: unknown } | null;
      if (!row) return WHATSAPP_BUTTON_DEFAULT;
      const parsed = whatsAppButtonSchema.safeParse(row.value);
      return parsed.success ? parsed.data : WHATSAPP_BUTTON_DEFAULT;
    } catch (err) {
      log.warn('getWhatsAppButtonConfig failed', undefined, err);
      return WHATSAPP_BUTTON_DEFAULT;
    }
  },
  ['whatsapp-button'],
  { revalidate: 3600, tags: ['whatsapp_button'] },
);

/**
 * Constrói a URL wa.me com mensagem URL-encoded.
 * Retorna null se desabilitado ou sem número.
 */
export function buildWhatsAppUrl(config: WhatsAppButtonConfig): string | null {
  if (!config.enabled || !config.number) return null;
  const params = new URLSearchParams();
  if (config.message) params.set('text', config.message);
  const qs = params.toString();
  return `https://wa.me/${config.number}${qs ? `?${qs}` : ''}`;
}

type CommercialCtaOptions = {
  /** Contexto que enriquece a mensagem (nome do produto/marca/etc). */
  context?: string;
  /** Fallback quando WhatsApp desabilitado. Default: '/contato'. */
  fallbackPath?: string;
};

/**
 * Constrói href de CTA comercial (Solicitar proposta, Falar com a equipe, etc).
 *
 * - WhatsApp habilitado + tem número → URL wa.me com mensagem enriquecida pelo context
 * - WhatsApp desabilitado ou sem número → fallback para /contato (form tradicional)
 *
 * Use em CTAs cliente-final onde a conversão direta no zap aproveita o lead
 * mais rápido. Para fluxos formais (representantes, trabalhe conosco), prefira
 * o formulário tradicional direto.
 *
 * Ex:
 *   const href = buildCommercialCtaHref(config, { context: `Molho de Tomate ${brandName}` });
 *   // → https://wa.me/55...?text=Olá!%20Vim%20pelo%20site...%20Interessei%20em%20Molho%20de%20Tomate%20Cocina.
 */
export function buildCommercialCtaHref(
  config: WhatsAppButtonConfig,
  options: CommercialCtaOptions = {},
): string {
  const fallback = options.fallbackPath ?? '/contato';
  if (!config.enabled || !config.number) return fallback;

  // Mensagem base do admin + context (se houver)
  const parts = [config.message.trim()];
  if (options.context) {
    parts.push(`Interessei em: ${options.context}.`);
  }
  const text = parts.filter(Boolean).join(' ');

  const params = new URLSearchParams();
  if (text) params.set('text', text);
  const qs = params.toString();
  return `https://wa.me/${config.number}${qs ? `?${qs}` : ''}`;
}

/**
 * Decide se um CTA deve abrir em nova aba. Quando o destino é wa.me,
 * abre em nova aba (UX padrão de WhatsApp Web). Quando é /contato interno,
 * navega no mesmo tab.
 */
export function isExternalCtaHref(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}
