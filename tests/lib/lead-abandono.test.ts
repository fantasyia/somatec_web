import { describe, it, expect } from 'vitest';
import { buildMullerBotPayload } from '@/lib/mullerbot/payload';
import { LGPD_PUBLIC_DEFAULT, LGPD_PUBLIC_IMPLICITO } from '@/lib/lgpd-public';
import { createHash } from 'node:crypto';
import type { FormSubmitData } from '@/lib/forms/schemas';

// =============================================================================
// LEAD DE ABANDONO — quem preencheu o contato e não concluiu.
//
// Hoje o CRM só recebe quem chega ao fim; o resto do funil evapora. A decisão
// do Léo (30/08) foi capturar todo mundo que entregou os dados, sob AVISO de
// LGPD no passo do contato — consentimento implícito, sem caixa de marcar.
//
// O que se protege aqui é a parte que uma auditoria de LGPD vai cobrar: os
// dois padrões de consentimento (o aviso e o checkbox) têm que se separar
// SOZINHOS no registro, sem depender da memória de ninguém sobre qual lead
// veio de onde.
// =============================================================================

const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex');

function payload(formulario: string, extra: Record<string, unknown> = {}) {
  return buildMullerBotPayload({
    validated: {
      form_type: 'b2b',
      interest_type: 'b2b',
      name: 'Fulano de Teste',
      email: 'fulano@exemplo.test',
      whatsapp: '11999999999',
      message: 'resumo',
      lgpd_consent: true,
      source_page: '/protecao-residencial',
      website: '',
      captcha_token: 'tok',
      formulario,
      publico: 'residencia',
      ...extra,
    } as unknown as FormSubmitData,
    ip: '1.2.3.4',
    userAgent: 'teste',
    referer: null,
    lgpdTextVersion: LGPD_PUBLIC_DEFAULT.version,
    lgpdTextRaw: LGPD_PUBLIC_DEFAULT.text,
  });
}

describe('consentimento implícito x explícito', () => {
  it('o abandono grava o texto do AVISO, não o do checkbox', () => {
    // A pessoa nunca viu o checkbox do passo 5. Registrar o texto dele seria
    // guardar prova de um consentimento que não aconteceu daquele jeito.
    const p = payload('checkout-ni-abandono');
    expect(p.lgpd_consent.text_version).toBe(LGPD_PUBLIC_IMPLICITO.version);
    expect(p.lgpd_consent.text_hash).toBe(sha256(LGPD_PUBLIC_IMPLICITO.text));
  });

  it('o pedido continua gravando o texto do checkbox', () => {
    const p = payload('checkout-ni-pedido');
    expect(p.lgpd_consent.text_version).toBe(LGPD_PUBLIC_DEFAULT.version);
    expect(p.lgpd_consent.text_hash).toBe(sha256(LGPD_PUBLIC_DEFAULT.text));
  });

  it('os dois padrões NÃO colidem — é isso que os separa numa auditoria', () => {
    const a = payload('checkout-ni-abandono');
    const b = payload('checkout-ni-pedido');
    expect(a.lgpd_consent.text_version).not.toBe(b.lgpd_consent.text_version);
    expect(a.lgpd_consent.text_hash).not.toBe(b.lgpd_consent.text_hash);
  });

  it('o texto do aviso implícito menciona a política e o direito de exclusão', () => {
    // É o texto que sustenta a captura. Se alguém encurtar e tirar isso, a
    // base do consentimento cai junto — e o hash mudaria sem ninguém notar.
    expect(LGPD_PUBLIC_IMPLICITO.text).toMatch(/Pol[íi]tica de Privacidade/);
    expect(LGPD_PUBLIC_IMPLICITO.text).toMatch(/exclus[ãa]o/);
  });
});

describe('etiqueta do abandono', () => {
  it('quem abandonou sai etiquetado, separável de quem comprou', () => {
    expect(payload('checkout-ni-abandono').tags).toContain('checkout-abandonado');
  });

  it('quem CONCLUIU não leva a etiqueta — senão "obrigado pela compra" vira retargeting', () => {
    expect(payload('checkout-ni-pedido').tags ?? []).not.toContain('checkout-abandonado');
  });

  it('a etiqueta de público continua vindo junto', () => {
    // O abandono não pode perder o roteamento: ele é lead como qualquer outro.
    expect(payload('checkout-ni-abandono').tags?.length).toBeGreaterThan(1);
  });

  it('a etiqueta sai do SLUG, no servidor — não de tag mandada pelo browser', () => {
    // Aceitar etiqueta livre do cliente deixaria qualquer um escrever no CRM.
    const p = payload('checkout-ni-pedido', { tags: ['checkout-abandonado'] });
    expect(p.tags ?? []).not.toContain('checkout-abandonado');
  });
});
