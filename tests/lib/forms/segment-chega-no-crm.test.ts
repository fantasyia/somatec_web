import { describe, it, expect } from 'vitest';
import { formSubmitSchema, type FormSubmitData } from '@/lib/forms/schemas';
import { buildMullerBotPayload } from '@/lib/mullerbot/payload';

/**
 * Regressão do campo "segmento" do CRM.
 *
 * O `segment` (rótulo legível de público+setor) atravessa DUAS portas até o
 * Betinna, e falhar em qualquer uma some com o dado sem erro nenhum:
 *
 *   1. schemas.ts  — campo não declarado é removido pelo Zod em SILÊNCIO
 *   2. PICK_AS_EXTRA — só o que está na lista vira extra_fields, e é de lá que
 *      betinna/client.ts tira o `segmento`
 *
 * Entre 2026 e 12/09 o /contato caía nas duas: o ContactForm montava o campo,
 * o comentário ao lado dizia que ele ia, e o lead chegava sem segmento.
 */

const enviadoPeloForm = {
  form_type: 'contato_geral',
  interest_type: 'b2b',
  formulario: 'contato',
  name: 'Fulano de Tal',
  email: 'fulano@example.com',
  whatsapp: '+5511987654321',
  message: 'oi',
  lgpd_consent: true,
  source_page: '/contato',
  website: '',
  captcha_token: 'tk',
  company: 'Acme',
  publico: 'industria',
  setor: 'alimenticio-bebidas',
  segment: 'Alimentício e bebidas',
};

const contexto = {
  ip: '1.2.3.4',
  userAgent: 'TestAgent/1.0',
  referer: null,
  lgpdTextVersion: 'v1.0',
  lgpdTextRaw: 'Texto LGPD de teste',
};

function parseOuFalhar(entrada: Record<string, unknown>): FormSubmitData {
  const r = formSubmitSchema.safeParse(entrada);
  if (!r.success) throw new Error('schema recusou: ' + JSON.stringify(r.error.issues));
  return r.data;
}

describe('segment chega ao CRM', () => {
  it('porta 1: o schema PRESERVA segment no contato_geral', () => {
    const data = parseOuFalhar(enviadoPeloForm) as unknown as Record<string, unknown>;
    expect(data.segment).toBe('Alimentício e bebidas');
  });

  it('porta 2: segment vira extra_fields no contato_geral', () => {
    const payload = buildMullerBotPayload({
      ...contexto,
      validated: parseOuFalhar(enviadoPeloForm),
    });
    expect(payload.extra_fields.segment).toBe('Alimentício e bebidas');
  });

  it('as tags de público/setor continuam indo (roteiam a nutrição)', () => {
    const payload = buildMullerBotPayload({
      ...contexto,
      validated: parseOuFalhar(enviadoPeloForm),
    });
    expect(payload.tags).toEqual(['publico:industria', 'setor:alimenticio-bebidas']);
  });

  it('sem setor escolhido, segment vira null — e o client omite o campo', () => {
    const semSetor = { ...enviadoPeloForm };
    delete (semSetor as Record<string, unknown>).publico;
    delete (semSetor as Record<string, unknown>).setor;
    delete (semSetor as Record<string, unknown>).segment;

    const payload = buildMullerBotPayload({ ...contexto, validated: parseOuFalhar(semSetor) });
    expect(payload.extra_fields.segment).toBeNull();
  });

  it('o b2b (calculadora, pedidos, orçamento) segue mandando segment', () => {
    const payload = buildMullerBotPayload({
      ...contexto,
      validated: parseOuFalhar({
        ...enviadoPeloForm,
        form_type: 'b2b',
        formulario: 'custo-de-parada',
        segment: 'NI · comercio',
      }),
    });
    expect(payload.extra_fields.segment).toBe('NI · comercio');
  });
});
