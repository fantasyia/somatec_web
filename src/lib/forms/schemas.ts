import { z } from 'zod';

// =============================================================================
// Schemas Zod — formulários públicos (v1.0 §13 + adendo v1.1 §3, §5, §12)
// =============================================================================

const trimmed = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} é obrigatório`).max(max, `${label} muito longo`);

// Telefone BR — aceita +55 DDD número (10 ou 11 dígitos no número, com ou sem máscara)
const whatsappSchema = z
  .string()
  .trim()
  .min(10, 'WhatsApp inválido')
  .max(20, 'WhatsApp inválido')
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length >= 10 && v.length <= 13, 'WhatsApp inválido')
  .transform((v) => {
    // Normaliza para +55XXXXXXXXXXX
    if (v.startsWith('55')) return `+${v}`;
    return `+55${v}`;
  });

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'E-mail inválido')
  .max(120, 'E-mail muito longo')
  .email('E-mail inválido');

const lgpdSchema = z.literal(true, {
  errorMap: () => ({ message: 'É preciso aceitar a Política de Privacidade' }),
});

// Honeypot — se preenchido, é bot. Validação aceita string vazia ou null/undefined.
const honeypotSchema = z
  .string()
  .max(0, 'Spam detected')
  .optional()
  .default('');

// Turnstile token — a verificação real é em verifyTurnstile() no handler.
// Zod só normaliza para string (aceita vazio/undefined).
const turnstileSchema = z.string().max(2048).optional().default('');

// -----------------------------------------------------------------------------
// Atribuição de marketing (UTM/gclid/fbclid) — valor CRU do site, camelCase.
// Todos os campos opcionais; o backend do Betinna normaliza e sanitiza. Limites
// só como guarda-corpo (o util já capa em 512). Ver src/lib/attribution.ts.
// -----------------------------------------------------------------------------
const attributionTouchSchema = z
  .object({
    utmSource: z.string().max(600),
    utmMedium: z.string().max(600),
    utmCampaign: z.string().max(600),
    utmContent: z.string().max(600),
    utmTerm: z.string().max(600),
    gclid: z.string().max(600),
    fbclid: z.string().max(600),
    landingPage: z.string().max(600),
    referrer: z.string().max(1000),
    capturadoEm: z.string().max(40),
  })
  .partial();

const atribuicaoSchema = z.object({
  primeiro: attributionTouchSchema,
  ultimo: attributionTouchSchema,
});

// Campos comuns a todos os formulários
const baseFields = {
  name: trimmed(2, 120, 'Nome'),
  email: emailSchema,
  whatsapp: whatsappSchema,
  message: z.string().trim().max(2000, 'Mensagem muito longa').optional().default(''),
  lgpd_consent: lgpdSchema,
  source_page: z.string().max(200).optional().default('/contato'),
  website: honeypotSchema, // honeypot
  captcha_token: turnstileSchema,
  // Qual dos formulários do site converteu (intenção difere: calculadora=topo,
  // representante=outro tipo de contato).
  formulario: z
    .enum(['contato', 'representante', 'calculadora', 'seletor'])
    .optional(),
  atribuicao: atribuicaoSchema.optional(),
};

// -----------------------------------------------------------------------------
// Extra fields por tipo de formulário (v1.0 §13)
// -----------------------------------------------------------------------------

const cityStateFields = {
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(2).optional().default(''),
};

export const representanteSchema = z.object({
  ...baseFields,
  interest_type: z.literal('representante'),
  ...cityStateFields,
  region: z.string().trim().max(120).optional().default(''),
  experience: z.string().trim().max(500).optional().default(''),
});

export const foodServiceSchema = z.object({
  ...baseFields,
  interest_type: z.literal('food_service'),
  ...cityStateFields,
  company: z.string().trim().max(160).optional().default(''),
  operation_type: z.string().trim().max(160).optional().default(''),
});

export const b2bSchema = z.object({
  ...baseFields,
  interest_type: z.literal('b2b'),
  company: z.string().trim().max(160).optional().default(''),
  segment: z.string().trim().max(160).optional().default(''),
  estimated_volume: z.string().trim().max(160).optional().default(''),
});

export const terceirizacaoSchema = z.object({
  ...baseFields,
  interest_type: z.literal('terceirizacao'),
  company: z.string().trim().max(160).optional().default(''),
  product_interest: z.string().trim().max(160).optional().default(''),
  estimated_volume: z.string().trim().max(160).optional().default(''),
});

export const envaseSchema = z.object({
  ...baseFields,
  interest_type: z.literal('envase'),
  company: z.string().trim().max(160).optional().default(''),
  product_type: z.string().trim().max(160).optional().default(''),
  packaging_type: z.string().trim().max(160).optional().default(''),
  estimated_volume: z.string().trim().max(160).optional().default(''),
});

export const contatoGeralSchema = z.object({
  ...baseFields,
  interest_type: z.enum([
    'food_service',
    'b2b',
    'terceirizacao',
    'envase',
    'marcas_proprias',
    'distribuicao',
    'representante',
  ]),
  ...cityStateFields,
  company: z.string().trim().max(160).optional().default(''),
});

// -----------------------------------------------------------------------------
// Union para o endpoint /api/forms/submit
// -----------------------------------------------------------------------------

export const formSubmitSchema = z.discriminatedUnion('form_type', [
  z.object({ form_type: z.literal('representante') }).merge(representanteSchema),
  z.object({ form_type: z.literal('food_service') }).merge(foodServiceSchema),
  z.object({ form_type: z.literal('b2b') }).merge(b2bSchema),
  z.object({ form_type: z.literal('terceirizacao') }).merge(terceirizacaoSchema),
  z.object({ form_type: z.literal('envase') }).merge(envaseSchema),
  z.object({ form_type: z.literal('contato_geral') }).merge(contatoGeralSchema),
]);

export type FormSubmitInput = z.input<typeof formSubmitSchema>;
export type FormSubmitData = z.output<typeof formSubmitSchema>;

export type ContactFormType =
  | 'representante'
  | 'food_service'
  | 'b2b'
  | 'terceirizacao'
  | 'envase'
  | 'contato_geral';

export type RepresentanteData = z.output<typeof representanteSchema>;
export type FoodServiceData = z.output<typeof foodServiceSchema>;
export type B2bData = z.output<typeof b2bSchema>;
export type TerceirizacaoData = z.output<typeof terceirizacaoSchema>;
export type EnvaseData = z.output<typeof envaseSchema>;
export type ContatoGeralData = z.output<typeof contatoGeralSchema>;

export const SCHEMA_BY_TYPE = {
  representante: representanteSchema,
  food_service: foodServiceSchema,
  b2b: b2bSchema,
  terceirizacao: terceirizacaoSchema,
  envase: envaseSchema,
  contato_geral: contatoGeralSchema,
} as const;
