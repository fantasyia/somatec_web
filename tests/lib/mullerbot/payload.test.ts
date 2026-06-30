import { describe, it, expect } from 'vitest';
import { buildMullerBotPayload } from '@/lib/mullerbot/payload';
import type { FormSubmitData } from '@/lib/forms/schemas';

const baseInput = {
  ip: '10.0.0.1',
  userAgent: 'TestAgent/1.0',
  referer: 'https://msm.com.br/contato',
  lgpdTextVersion: 'v1.0',
  lgpdTextRaw: 'Texto LGPD de teste',
};

function makeValidated(overrides: Partial<FormSubmitData> = {}): FormSubmitData {
  return {
    form_type: 'b2b',
    interest_type: 'b2b',
    name: 'Maria Santos',
    email: 'maria@example.com',
    whatsapp: '+5511987654321',
    message: '',
    lgpd_consent: true,
    source_page: '/contato',
    website: '',
    captcha_token: 'tk',
    company: 'Acme S/A',
    segment: 'industria',
    estimated_volume: '10t/mês',
    ...overrides,
  } as FormSubmitData;
}

describe('buildMullerBotPayload', () => {
  it('monta payload base com todos os campos obrigatórios', () => {
    const payload = buildMullerBotPayload({
      ...baseInput,
      validated: makeValidated(),
    });

    expect(payload.form_type).toBe('b2b');
    expect(payload.name).toBe('Maria Santos');
    expect(payload.email).toBe('maria@example.com');
    expect(payload.whatsapp).toBe('+5511987654321');
    expect(payload.company).toBe('Acme S/A');
    expect(payload.source_page).toBe('/contato');
    expect(payload.captcha_token).toBe('tk');
  });

  it('captcha_unverified: false por padrão, true quando passado (fail-open)', () => {
    const p1 = buildMullerBotPayload({ ...baseInput, validated: makeValidated() });
    expect(p1.captcha_unverified).toBe(false);
    const p2 = buildMullerBotPayload({ ...baseInput, validated: makeValidated(), captchaUnverified: true });
    expect(p2.captcha_unverified).toBe(true);
  });

  it('mantém site_metadata correto', () => {
    const payload = buildMullerBotPayload({
      ...baseInput,
      validated: makeValidated(),
    });
    expect(payload.site_metadata.user_agent).toBe('TestAgent/1.0');
    expect(payload.site_metadata.referer).toBe('https://msm.com.br/contato');
    expect(payload.site_metadata.submitted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('LGPD: hash sha256 estável + accepted + version + ip', () => {
    const payload = buildMullerBotPayload({
      ...baseInput,
      validated: makeValidated(),
    });
    expect(payload.lgpd_consent.accepted).toBe(true);
    expect(payload.lgpd_consent.ip).toBe('10.0.0.1');
    expect(payload.lgpd_consent.text_version).toBe('v1.0');
    // sha256("Texto LGPD de teste")
    expect(payload.lgpd_consent.text_hash).toHaveLength(64);
    expect(payload.lgpd_consent.text_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hash idêntico para mesmo texto', () => {
    const p1 = buildMullerBotPayload({ ...baseInput, validated: makeValidated() });
    const p2 = buildMullerBotPayload({ ...baseInput, validated: makeValidated() });
    expect(p1.lgpd_consent.text_hash).toBe(p2.lgpd_consent.text_hash);
  });

  it('hash diferente para texto diferente', () => {
    const p1 = buildMullerBotPayload({ ...baseInput, validated: makeValidated() });
    const p2 = buildMullerBotPayload({
      ...baseInput,
      lgpdTextRaw: 'Texto modificado',
      validated: makeValidated(),
    });
    expect(p1.lgpd_consent.text_hash).not.toBe(p2.lgpd_consent.text_hash);
  });

  it('extra_fields b2b: segment + estimated_volume', () => {
    const payload = buildMullerBotPayload({
      ...baseInput,
      validated: makeValidated(),
    });
    expect(payload.extra_fields).toEqual({
      segment: 'industria',
      estimated_volume: '10t/mês',
    });
  });

  it('extra_fields representante: region + experience', () => {
    const payload = buildMullerBotPayload({
      ...baseInput,
      validated: makeValidated({
        form_type: 'representante',
        interest_type: 'representante',
        region: 'Sudeste',
        experience: '5 anos',
        company: '',
      } as Partial<FormSubmitData>),
    });
    expect(payload.extra_fields).toEqual({
      region: 'Sudeste',
      experience: '5 anos',
    });
  });

  it('state em uppercase', () => {
    const payload = buildMullerBotPayload({
      ...baseInput,
      validated: makeValidated({
        form_type: 'food_service',
        interest_type: 'food_service',
        state: 'sp',
        city: 'São Paulo',
      } as Partial<FormSubmitData>),
    });
    expect(payload.state).toBe('SP');
    expect(payload.city).toBe('São Paulo');
  });

  it('campos vazios viram null (não string vazia)', () => {
    const payload = buildMullerBotPayload({
      ...baseInput,
      validated: makeValidated({
        message: '',
        company: '',
      } as Partial<FormSubmitData>),
    });
    expect(payload.message).toBeNull();
    expect(payload.company).toBeNull();
  });

  it('referer null preservado', () => {
    const payload = buildMullerBotPayload({
      ...baseInput,
      referer: null,
      validated: makeValidated(),
    });
    expect(payload.site_metadata.referer).toBeNull();
  });
});
