import { describe, it, expect } from 'vitest';
import { CONTACT, whatsappHref } from '@/lib/constants/site';
import { HEADER_CTAS } from '@/lib/constants/navigation';
import { WHATSAPP_BUTTON_DEFAULT, buildWhatsAppUrl } from '@/lib/whatsapp-button';

// =============================================================================
// Dados de contato (Léo, 21/08). Estavam escritos à mão em /contato, no JSON-LD
// e no rodapé — trocar um deixava os outros mentindo. Agora saem todos de
// lib/constants/site.ts, e estes testes travam o que não pode regredir.
// =============================================================================

describe('canal de contato', () => {
  it('o número comercial é o do Léo, em formato wa.me', () => {
    expect(CONTACT.whatsappDigits).toBe('5511917644757');
    expect(CONTACT.whatsappDisplay).toBe('+55 11 91764-4757');
  });

  it('o e-mail é o comercial', () => {
    expect(CONTACT.email).toBe('comercial@somatecblocking.com.br');
  });

  it('⛔ NÃO existe canal de telefone', () => {
    // Não há atendimento por ligação neste contato — só WhatsApp. Ligação é
    // coisa de representante, combinada depois, não porta de entrada do site.
    expect(JSON.stringify(CONTACT)).not.toMatch(/tel:/);
    expect(JSON.stringify(CONTACT)).not.toMatch(/telefone/i);
  });

  it('o endereço é o de São Paulo, com CEP', () => {
    expect(CONTACT.address).toContain('Av. Fagundes Filho, 145');
    expect(CONTACT.address).toContain('04304-000');
    expect(CONTACT.endereco.cidade).toBe('São Paulo');
    // O endereço velho (Dracena) não pode voltar por engano.
    expect(CONTACT.address).not.toMatch(/Dracena|Rua XV de Novembro/i);
  });
});

describe('whatsappHref', () => {
  it('monta o link com a mensagem já digitada', () => {
    const href = whatsappHref('Olá!');
    expect(href).toBe('https://wa.me/5511917644757?text=Ol%C3%A1!');
  });

  it('sem texto, manda só o número', () => {
    expect(whatsappHref()).toBe('https://wa.me/5511917644757');
  });
});

describe('"Fale com o Comercial" vai direto pro WhatsApp', () => {
  it('o CTA do header aponta pro wa.me, não pro formulário', () => {
    expect(HEADER_CTAS.commercial.href).toContain('wa.me/5511917644757');
    expect(HEADER_CTAS.commercial.href).not.toContain('/contato');
  });

  it('está marcado como externo (abre em outra aba)', () => {
    expect(HEADER_CTAS.commercial.externo).toBe(true);
  });
});

describe('botão flutuante do WhatsApp', () => {
  it('nasce LIGADO e com número — antes vinha vazio e nunca aparecia', () => {
    expect(WHATSAPP_BUTTON_DEFAULT.enabled).toBe(true);
    expect(WHATSAPP_BUTTON_DEFAULT.number).toBe(CONTACT.whatsappDigits);
    expect(buildWhatsAppUrl(WHATSAPP_BUTTON_DEFAULT)).toContain('wa.me/5511917644757');
  });

  it('config salva SEM número cai no número comercial (linha nunca configurada)', () => {
    const url = buildWhatsAppUrl({ enabled: true, number: '', message: 'oi' });
    expect(url).toContain('wa.me/5511917644757');
  });

  it('desligar de propósito continua desligando', () => {
    expect(buildWhatsAppUrl({ enabled: false, number: '5511917644757', message: '' })).toBeNull();
  });
});
