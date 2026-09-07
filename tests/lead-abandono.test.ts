import { describe, it, expect } from 'vitest';
import { formSubmitSchema } from '@/lib/forms/schemas';

// =============================================================================
// LEAD DE ABANDONO — basta UM canal. Todo o resto continua exigindo os dois.
//
// Decisão do Léo (07/09): "pega todo mundo, contanto que haja o e-mail ou o
// whatsapp, senão não tem lógica". Antes o abandono só disparava com nome,
// e-mail E whatsapp preenchidos — quem digitava o e-mail e ia embora antes do
// telefone evaporava, que é justamente o perfil que a régua de nutrição existe
// pra pegar.
//
// ⚠️ O RISCO DESTA MUDANÇA é vazar pros outros formulários. Ela mexeu em
// `baseFields`, que é compartilhado por SEIS schemas: e-mail e whatsapp passaram
// a aceitar vazio ali, e a obrigatoriedade voltou num superRefine. Se o
// superRefine sumir ou for mal escrito, o site inteiro passa a aceitar lead sem
// contato — e ninguém percebe, porque nada dá erro.
//
// Por isso metade destes testes é sobre o que NÃO pode mudar.
// =============================================================================

const base = {
  form_type: 'b2b' as const,
  interest_type: 'b2b' as const,
  name: 'Fulano de Tal',
  lgpd_consent: true as const,
  source_page: '/protecao-comercial',
  website: '',
  captcha_token: 'token-qualquer',
};

const EMAIL = 'pessoa@exemplo.com.br';
const WHATS = '11987654321';

describe('lead de ABANDONO — um canal basta', () => {
  it('só com e-mail passa', () => {
    const r = formSubmitSchema.safeParse({
      ...base,
      formulario: 'checkout-ni-abandono',
      email: EMAIL,
      whatsapp: '',
    });
    expect(r.success, JSON.stringify(r.success ? {} : r.error.issues)).toBe(true);
  });

  it('só com whatsapp passa', () => {
    const r = formSubmitSchema.safeParse({
      ...base,
      formulario: 'checkout-ni-abandono',
      email: '',
      whatsapp: WHATS,
    });
    expect(r.success, JSON.stringify(r.success ? {} : r.error.issues)).toBe(true);
  });

  it('⛔ sem canal nenhum é RECUSADO — lead sem contato é inútil', () => {
    const r = formSubmitSchema.safeParse({
      ...base,
      formulario: 'checkout-ni-abandono',
      email: '',
      whatsapp: '',
    });
    expect(r.success).toBe(false);
  });

  it('o whatsapp continua sendo normalizado pra +55', () => {
    const r = formSubmitSchema.safeParse({
      ...base,
      formulario: 'checkout-ni-abandono',
      email: '',
      whatsapp: WHATS,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.whatsapp).toBe(`+55${WHATS}`);
  });
});

describe('🔒 a exceção NÃO pode vazar pros outros formulários', () => {
  // Se qualquer um destes passar, o site aceita lead sem contato — e o sintoma
  // só aparece semanas depois, como lead que ninguém consegue atender.
  const OUTROS = [
    'checkout-ni-pedido',
    'checkout-ni-orcamento',
    'orcamento-industrial',
    'custo-de-parada',
    'contato',
    'representante',
  ] as const;

  it.each(OUTROS)('%s SEM whatsapp é recusado', (formulario) => {
    const r = formSubmitSchema.safeParse({ ...base, formulario, email: EMAIL, whatsapp: '' });
    expect(r.success, `${formulario} passou sem whatsapp`).toBe(false);
  });

  it.each(OUTROS)('%s SEM e-mail é recusado', (formulario) => {
    const r = formSubmitSchema.safeParse({ ...base, formulario, email: '', whatsapp: WHATS });
    expect(r.success, `${formulario} passou sem e-mail`).toBe(false);
  });

  it('formulário AUSENTE também exige os dois — não vira brecha', () => {
    // `formulario` é opcional no schema. Sem ele, o payload não é abandono e
    // tem de cair na regra estrita; do contrário, omitir o campo seria a porta.
    expect(formSubmitSchema.safeParse({ ...base, email: EMAIL, whatsapp: '' }).success).toBe(false);
    expect(formSubmitSchema.safeParse({ ...base, email: '', whatsapp: WHATS }).success).toBe(false);
  });

  it('com os dois preenchidos, qualquer formulário passa', () => {
    for (const formulario of [...OUTROS, 'checkout-ni-abandono'] as const) {
      const r = formSubmitSchema.safeParse({ ...base, formulario, email: EMAIL, whatsapp: WHATS });
      expect(r.success, `${formulario} deveria passar`).toBe(true);
    }
  });

  it('e-mail inválido continua sendo recusado — vazio é diferente de errado', () => {
    const r = formSubmitSchema.safeParse({
      ...base,
      formulario: 'checkout-ni-abandono',
      email: 'nao-e-email',
      whatsapp: WHATS,
    });
    expect(r.success).toBe(false);
  });
});
