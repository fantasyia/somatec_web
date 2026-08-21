import 'server-only';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { CONTACT } from '@/lib/constants/site';

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

// LIGADO por padrão, com o número comercial real (Léo, 21/08). Antes vinha
// desligado e sem número, então o botão flutuante simplesmente nunca aparecia —
// dependia de alguém lembrar de configurar em /admin/whatsapp. O admin continua
// mandando: se existir config salva, ela vence.
export const WHATSAPP_BUTTON_DEFAULT: WhatsAppButtonConfig = {
  enabled: true,
  number: CONTACT.whatsappDigits,
  message: 'Olá! Vim pelo site da Somatec Blocking e gostaria de saber mais.',
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
      if (!parsed.success) return WHATSAPP_BUTTON_DEFAULT;
      // Linha SEM número = NUNCA configurada (é o default antigo, que nasceu
      // com number:'' e enabled:false e ficou salvo). Isso não é "alguém
      // desligou": é o botão nunca ter sido ligado. Cai no default.
      if (!parsed.data.number) return WHATSAPP_BUTTON_DEFAULT;
      // ⛔ O NÚMERO salvo é IGNORADO de propósito. Produção tinha o número
      // ANTIGO gravado aqui e seguiu publicando ele mesmo depois de o número
      // novo entrar no código — o site mentia e ninguém via. O número da
      // empresa é um fato só (CONTACT), não config por ambiente.
      // Do banco vale o que é decisão de operação: LIGAR/DESLIGAR e a MENSAGEM.
      return {
        enabled: parsed.data.enabled,
        number: CONTACT.whatsappDigits,
        message: parsed.data.message || WHATSAPP_BUTTON_DEFAULT.message,
      };
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
  if (!config.enabled) return null;
  const numero = CONTACT.whatsappDigits;
  const params = new URLSearchParams();
  if (config.message) params.set('text', config.message);
  const qs = params.toString();
  return `https://wa.me/${numero}${qs ? `?${qs}` : ''}`;
}

type CommercialCtaOptions = {
  /** Contexto que enriquece a mensagem (nome do produto/marca/etc). */
  context?: string;
  /** Substitui a mensagem inteira — pra CTA que precisa rotear o atendimento
   *  (ex.: "quero falar com a engenharia" → trilha industrial). */
  mensagem?: string;
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
  if (!config.enabled) return fallback;
  const numero = CONTACT.whatsappDigits;

  // `mensagem` troca o texto todo (ex.: "quero falar com a engenharia", que faz
  // o atendimento cair direto no trilho industrial). Sem ela, mensagem do admin
  // + o contexto do que a pessoa estava lendo.
  const parts = options.mensagem
    ? [options.mensagem.trim()]
    : [config.message.trim(), ...(options.context ? [`Interessei em: ${options.context}.`] : [])];
  const text = parts.filter(Boolean).join(' ');

  const params = new URLSearchParams();
  if (text) params.set('text', text);
  const qs = params.toString();
  return `https://wa.me/${numero}${qs ? `?${qs}` : ''}`;
}

/**
 * Decide se um CTA deve abrir em nova aba. Quando o destino é wa.me,
 * abre em nova aba (UX padrão de WhatsApp Web). Quando é /contato interno,
 * navega no mesmo tab.
 */
export function isExternalCtaHref(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}
