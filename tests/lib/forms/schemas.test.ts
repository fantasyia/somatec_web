import { describe, it, expect } from 'vitest';
import {
  formSubmitSchema,
  representanteSchema,
  b2bSchema,
  contatoGeralSchema,
} from '@/lib/forms/schemas';

const validBase = {
  name: 'João da Silva',
  email: 'joao@example.com',
  whatsapp: '11987654321',
  lgpd_consent: true,
};

describe('formSubmitSchema', () => {
  it('aceita representante válido', () => {
    const result = formSubmitSchema.safeParse({
      ...validBase,
      form_type: 'representante',
      interest_type: 'representante',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita form_type desconhecido', () => {
    const result = formSubmitSchema.safeParse({
      ...validBase,
      form_type: 'invalid',
      interest_type: 'b2b',
    });
    expect(result.success).toBe(false);
  });

  it('aceita b2b válido', () => {
    const result = formSubmitSchema.safeParse({
      ...validBase,
      form_type: 'b2b',
      interest_type: 'b2b',
      company: 'Acme',
    });
    expect(result.success).toBe(true);
  });
});

describe('whatsapp normalization', () => {
  it('normaliza número BR 11 dígitos para +55', () => {
    const result = representanteSchema.safeParse({
      ...validBase,
      whatsapp: '(11) 98765-4321',
      form_type: 'representante',
      interest_type: 'representante',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsapp).toBe('+5511987654321');
  });

  it('mantém prefixo 55 se já vier', () => {
    const result = representanteSchema.safeParse({
      ...validBase,
      whatsapp: '5511987654321',
      form_type: 'representante',
      interest_type: 'representante',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsapp).toBe('+5511987654321');
  });

  it('rejeita whatsapp com poucos dígitos', () => {
    const result = representanteSchema.safeParse({
      ...validBase,
      whatsapp: '123',
      form_type: 'representante',
      interest_type: 'representante',
    });
    expect(result.success).toBe(false);
  });
});

describe('email validation', () => {
  it('lowercase automatico', () => {
    const result = b2bSchema.safeParse({
      ...validBase,
      email: 'TEST@EXAMPLE.COM',
      form_type: 'b2b',
      interest_type: 'b2b',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('test@example.com');
  });

  it('rejeita email inválido', () => {
    const result = b2bSchema.safeParse({
      ...validBase,
      email: 'not-an-email',
      form_type: 'b2b',
      interest_type: 'b2b',
    });
    expect(result.success).toBe(false);
  });
});

describe('LGPD consent', () => {
  it('rejeita false', () => {
    const result = b2bSchema.safeParse({
      ...validBase,
      lgpd_consent: false,
      form_type: 'b2b',
      interest_type: 'b2b',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita ausência do campo', () => {
    const { lgpd_consent, ...withoutConsent } = validBase;
    void lgpd_consent;
    const result = b2bSchema.safeParse({
      ...withoutConsent,
      form_type: 'b2b',
      interest_type: 'b2b',
    });
    expect(result.success).toBe(false);
  });
});

describe('honeypot', () => {
  it('rejeita se website preenchido (não-vazio)', () => {
    const result = b2bSchema.safeParse({
      ...validBase,
      website: 'spam',
      form_type: 'b2b',
      interest_type: 'b2b',
    });
    expect(result.success).toBe(false);
  });

  it('aceita website vazio', () => {
    const result = b2bSchema.safeParse({
      ...validBase,
      website: '',
      form_type: 'b2b',
      interest_type: 'b2b',
    });
    expect(result.success).toBe(true);
  });
});

describe('contato_geral interest_type enum', () => {
  it('aceita todos os tipos de interesse', () => {
    const tipos = [
      'food_service',
      'b2b',
      'terceirizacao',
      'envase',
      'marcas_proprias',
      'distribuicao',
      'representante',
    ] as const;
    for (const interest_type of tipos) {
      const result = contatoGeralSchema.safeParse({
        ...validBase,
        form_type: 'contato_geral',
        interest_type,
      });
      expect(result.success, `falhou para ${interest_type}`).toBe(true);
    }
  });

  it('rejeita interest_type fora do enum', () => {
    const result = contatoGeralSchema.safeParse({
      ...validBase,
      form_type: 'contato_geral',
      interest_type: 'qualquer',
    });
    expect(result.success).toBe(false);
  });
});
