import 'server-only';
import { createHash } from 'node:crypto';
import type { FormSubmitData } from '@/lib/forms/schemas';

// -----------------------------------------------------------------------------
// Builder do payload enviado ao MullerBot — adendo v1.1 §3.2
// -----------------------------------------------------------------------------

export type MullerBotPayload = {
  form_type: FormSubmitData['form_type'];
  name: string;
  email: string;
  whatsapp: string;
  interest_type: string;
  company: string | null;
  city: string | null;
  state: string | null;
  message: string | null;
  extra_fields: Record<string, string | null>;
  source_page: string;
  lgpd_consent: {
    accepted: boolean;
    timestamp: string;
    ip: string;
    text_version: string;
    text_hash: string;
  };
  captcha_token: string;
  /** true quando o Turnstile não pôde ser verificado (infra) e o lead foi aceito mesmo assim — sinaliza triagem no CRM. */
  captcha_unverified: boolean;
  site_metadata: {
    user_agent: string;
    referer: string | null;
    submitted_at: string;
  };
  /** Qual formulário do site converteu (contato|representante|calculadora|seletor). */
  formulario?: FormSubmitData['formulario'];
  /** Atribuição de marketing (1º + último toque). Ausente quando não há UTM. */
  atribuicao?: FormSubmitData['atribuicao'];
};

export type BuildPayloadInput = {
  validated: FormSubmitData;
  ip: string;
  userAgent: string;
  referer: string | null;
  lgpdTextVersion: string;
  lgpdTextRaw: string;
  captchaUnverified?: boolean;
};

const PICK_AS_EXTRA: Partial<Record<FormSubmitData['form_type'], string[]>> = {
  representante: ['region', 'experience'],
  food_service: ['operation_type'],
  b2b: ['segment', 'estimated_volume'],
  terceirizacao: ['product_interest', 'estimated_volume'],
  envase: ['product_type', 'packaging_type', 'estimated_volume'],
  contato_geral: [],
};

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function buildMullerBotPayload(input: BuildPayloadInput): MullerBotPayload {
  const { validated, ip, userAgent, referer, lgpdTextVersion, lgpdTextRaw } = input;
  const now = new Date().toISOString();

  const baseRecord = validated as unknown as Record<string, string | undefined>;
  const company = baseRecord.company ?? null;
  const city = baseRecord.city ?? null;
  const state = baseRecord.state ?? null;
  const message = baseRecord.message ?? null;

  const extraKeys = PICK_AS_EXTRA[validated.form_type] ?? [];
  const extra_fields: Record<string, string | null> = {};
  for (const key of extraKeys) {
    const value = baseRecord[key];
    extra_fields[key] = value && value.length > 0 ? value : null;
  }

  return {
    form_type: validated.form_type,
    name: validated.name,
    email: validated.email,
    whatsapp: validated.whatsapp,
    interest_type: validated.interest_type,
    company: company && company.length > 0 ? company : null,
    city: city && city.length > 0 ? city : null,
    state: state && state.length > 0 ? state.toUpperCase() : null,
    message: message && message.length > 0 ? message : null,
    extra_fields,
    source_page: validated.source_page ?? '/contato',
    lgpd_consent: {
      accepted: validated.lgpd_consent === true,
      timestamp: now,
      ip,
      text_version: lgpdTextVersion,
      text_hash: sha256(lgpdTextRaw),
    },
    captcha_token: validated.captcha_token ?? '',
    captcha_unverified: input.captchaUnverified ?? false,
    site_metadata: {
      user_agent: userAgent,
      referer,
      submitted_at: now,
    },
    formulario: validated.formulario,
    atribuicao: validated.atribuicao,
  };
}
