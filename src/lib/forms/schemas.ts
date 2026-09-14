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
  // ⚠️ O teto de 20 media o texto COM máscara (B2 da auditoria 13/09):
  // "+55 (011) 9 9999-9999" tem 21 caracteres e 13 dígitos — número válido que
  // o servidor recusava por causa da pontuação. O limite generoso aqui existe
  // só pra barrar payload absurdo; quem decide é a contagem de DÍGITOS abaixo.
  .max(40, 'WhatsApp inválido')
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
// ⚠️ E-mail e WhatsApp aceitam VAZIO aqui, e a obrigatoriedade volta no
// `superRefine` do formSubmitSchema. Não é afrouxamento: é o único jeito de
// abrir exceção pro lead de ABANDONO sem enfraquecer os outros formulários.
//
// Decisão do Léo (07/09): o abandono captura todo mundo, "contanto que haja o
// e-mail OU o whatsapp, senão não tem lógica". Antes o abandono só disparava
// com os TRÊS preenchidos — quem digitava o e-mail e ia embora sem o telefone
// evaporava, que é justamente o perfil que a régua de nutrição quer pegar.
//
// Pra todo o resto, os dois seguem obrigatórios como sempre foram.
const baseFields = {
  name: trimmed(2, 120, 'Nome'),
  email: z.union([z.literal(''), emailSchema]),
  whatsapp: z.union([z.literal(''), whatsappSchema]),
  message: z.string().trim().max(2000, 'Mensagem muito longa').optional().default(''),
  lgpd_consent: lgpdSchema,
  source_page: z.string().max(200).optional().default('/contato'),
  website: honeypotSchema, // honeypot
  captcha_token: turnstileSchema,
  /** ID do evento emitido pelo NAVEGADOR. O servidor reusa o mesmo valor no
   *  CAPI da Meta — é o que faz os dois disparos virarem um evento só. Sem
   *  declarar aqui o Zod descartava em silêncio (ele STRIP campo desconhecido,
   *  não reclama), e o CAPI acabaria gerando um id novo: conversão em dobro. */
  event_id: z.string().max(64).optional(),
  // Qual FERRAMENTA do site converteu. Um slug por ferramenta, estável — é por
  // ele que o Betinna roteia o fluxo. Antes, três ferramentas com jornadas
  // opostas mandavam o mesmo 'calculadora' e a única coisa que as separava era
  // o `segment`, que é TEXTO LIVRE: condição de fluxo comparando texto livre
  // quebra em silêncio no dia que alguém troca um hífen.
  //
  // ⚠️ Ao acrescentar ferramenta, o slug entra AQUI e a master precisa saber —
  // valor fora da lista é recusado no envio, não descartado calado.
  formulario: z
    .enum([
      'contato',
      'representante',
      'orcamento-industrial',
      // O CheckoutNI produz DUAS jornadas opostas: pedido esperando link de
      // pagamento × lead morno esperando orçamento. Slugs separados.
      'checkout-ni-pedido',
      'checkout-ni-orcamento',
      // Quem preencheu o contato e NÃO concluiu. Consentimento IMPLÍCITO (o
      // aviso no passo do contato, não o checkbox) — por isso slug próprio:
      // numa auditoria de LGPD os dois padrões precisam se separar sozinhos.
      'checkout-ni-abandono',
      'custo-de-parada',
    ])
    .optional(),
  atribuicao: atribuicaoSchema.optional(),
  // Público + setor → viram ETIQUETA no Betinna (roteiam o fluxo de nutrição).
  // Vocabulário fechado em lib/constants/setores.ts; aqui só validamos o
  // formato pra não deixar entrar valor inventado.
  publico: z.enum(['industria', 'comercio', 'residencia']).optional(),
  setor: z.string().trim().max(60).optional(),
  // Rótulo LEGÍVEL do par público+setor (rotuloSetor). É o que o Betinna
  // grava no campo "segmento" do lead, via extra_fields.
  //
  // ⚠️ Mora aqui, e não num schema só, porque o /contato manda desde sempre e
  // ficava de fora: declarado apenas no b2bSchema, o contato_geral caía no
  // strip silencioso do Zod (campo não declarado some sem erro nenhum) e o
  // campo "segmento" do CRM chegava vazio. Mesma armadilha do event_id.
  // Max 60 = o limite que o client.ts corta antes de mandar.
  segment: z.string().trim().max(60).optional().default(''),
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

// ⚠️ RESÍDUO CROSS-CLIENTE: aqui moravam foodServiceSchema, terceirizacaoSchema
// e envaseSchema — herdados do template da MSM Alimentos, com os campos
// operation_type, product_interest, product_type e packaging_type. Removidos em
// 12/09/2026: nenhuma página do site os enviava. O `estimated_volume` do b2b caiu
// junto — volume em kg/mês é medida de alimento, e a Somatec vende proteção
// elétrica. NÃO reintroduzir campo de alimento neste arquivo.
export const b2bSchema = z.object({
  ...baseFields,
  interest_type: z.literal('b2b'),
  company: z.string().trim().max(160).optional().default(''),
});

export const contatoGeralSchema = z.object({
  ...baseFields,
  // Os mesmos dois valores de INTEREST_TYPE_OPTIONS. 'marcas_proprias' e
  // 'distribuicao' eram modelos de negócio da MSM Alimentos e saíram em 12/09.
  interest_type: z.enum(['b2b', 'representante']),
  ...cityStateFields,
  company: z.string().trim().max(160).optional().default(''),
});

// -----------------------------------------------------------------------------
// Union para o endpoint /api/forms/submit
// -----------------------------------------------------------------------------

export const formSubmitSchema = z.discriminatedUnion('form_type', [
  z.object({ form_type: z.literal('representante') }).merge(representanteSchema),
  z.object({ form_type: z.literal('b2b') }).merge(b2bSchema),
  z.object({ form_type: z.literal('contato_geral') }).merge(contatoGeralSchema),
]).superRefine((d, ctx) => {
  // Contrapeso do vazio permitido em baseFields. A regra é uma só e mora aqui,
  // pra não ficar espalhada pelos schemas, que podem divergir com o tempo.
  const abandono = 'formulario' in d && d.formulario === 'checkout-ni-abandono';
  const temEmail = Boolean(d.email);
  const temWhats = Boolean(d.whatsapp);

  if (abandono) {
    // Lead de abandono: basta UM canal — sem canal nenhum o lead é inútil,
    // ninguém consegue falar com a pessoa.
    if (!temEmail && !temWhats) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Lead de abandono precisa de e-mail ou WhatsApp',
      });
    }
    return;
  }

  // Todos os outros formulários: os dois continuam obrigatórios.
  if (!temEmail) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'E-mail é obrigatório' });
  }
  if (!temWhats) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['whatsapp'],
      message: 'WhatsApp é obrigatório',
    });
  }
});

export type FormSubmitInput = z.input<typeof formSubmitSchema>;
export type FormSubmitData = z.output<typeof formSubmitSchema>;

export type ContactFormType = 'representante' | 'b2b' | 'contato_geral';

export type RepresentanteData = z.output<typeof representanteSchema>;
export type B2bData = z.output<typeof b2bSchema>;
export type ContatoGeralData = z.output<typeof contatoGeralSchema>;

export const SCHEMA_BY_TYPE = {
  representante: representanteSchema,
  b2b: b2bSchema,
  contato_geral: contatoGeralSchema,
} as const;
