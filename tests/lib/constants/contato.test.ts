import { describe, it, expect } from 'vitest';
import { CONTACT, whatsappHref } from '@/lib/constants/site';
import { HEADER_CTAS } from '@/lib/constants/navigation';
import { INTEREST_TYPE_OPTIONS } from '@/lib/constants/form-options';
import { WHATSAPP_BUTTON_DEFAULT, buildWhatsAppUrl, buildCommercialCtaHref } from '@/lib/whatsapp-button';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

describe('o número da empresa não pode vir de config por ambiente', () => {
  // Produção tinha o número ANTIGO em duas camadas — env var no Railway e a
  // linha `site_settings.whatsapp_button` — e seguiu publicando ele mesmo
  // depois de o número novo entrar no código. O site mentia e ninguém via.
  it('site.ts não lê env var pra telefone, e-mail ou endereço', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/lib/constants/site.ts'), 'utf-8');
    const bloco = fonte.slice(fonte.indexOf('export const CONTACT'), fonte.indexOf('export function whatsappHref'));
    expect(bloco).not.toMatch(/process\.env/);
  });

  it('o número salvo no banco é ignorado — vale sempre o CONTACT', () => {
    const url = buildWhatsAppUrl({ enabled: true, number: '5518981385088', message: 'oi' });
    expect(url).toContain('wa.me/5511917644757');
    expect(url).not.toContain('5518981385088');
  });

  it('o CTA comercial também ignora o número salvo', () => {
    const href = buildCommercialCtaHref(
      { enabled: true, number: '5518981385088', message: 'oi' },
      { mensagem: 'Olá! Quero proteger a minha fábrica.' },
    );
    expect(href).toContain('wa.me/5511917644757');
    expect(href).not.toContain('5518981385088');
  });
});

describe('a mensagem pré-preenchida é a FALA do cliente', () => {
  // URLSearchParams codifica espaço como '+', que decodeURIComponent não desfaz.
  const ler = (href: string) => decodeURIComponent(href).replace(/\+/g, ' ');

  it('`mensagem` SUBSTITUI a base do admin — não soma', () => {
    // Prefixar as duas faria o cliente mandar "gostaria de saber mais" antes
    // de dizer o que quer.
    const texto = ler(
      buildCommercialCtaHref(
        { enabled: true, number: '5511917644757', message: 'Olá! …gostaria de saber mais.' },
        { mensagem: 'Olá! Vim pelo site e quero proteger os equipamentos do meu comércio.' },
      ),
    );
    expect(texto).toContain('quero proteger os equipamentos do meu comércio');
    expect(texto).not.toContain('gostaria de saber mais');
  });

  it('sem `mensagem`, vale a base do admin (header, /contato)', () => {
    const texto = ler(
      buildCommercialCtaHref({ enabled: true, number: '5511917644757', message: 'Olá! Base do admin.' }, {}),
    );
    expect(texto).toContain('Olá! Base do admin.');
  });

  it('⛔ o template "Interessei em:" não existe mais no código', () => {
    // Enquanto ele existir, qualquer texto novo volta a sair como rótulo.
    const fonte = readFileSync(resolve(process.cwd(), 'src/lib/whatsapp-button.ts'), 'utf-8')
      .split('\n')
      .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'))
      .join('\n');
    expect(fonte).not.toContain('Interessei em');
  });
});

describe('formulário de contato — os dois selects não podem se contradizer', () => {
  // "Tipo de interesse" separa CLIENTE de CANDIDATO A REPRESENTANTE.
  // Quem é o visitante sai do campo seguinte (público: indústria/comércio/
  // residência). O rótulo do cliente dizia "para a minha indústria" e obrigava
  // quem ia marcar "Comércio" a declarar antes que era indústria.
  it('o rótulo do cliente não declara público nenhum', () => {
    const cliente = INTEREST_TYPE_OPTIONS.find((o) => o.value === 'b2b');
    expect(cliente).toBeDefined();
    expect(cliente!.label).not.toMatch(/ind[úu]stria|com[ée]rcio|resid[êe]ncia/i);
  });

  it('e não oferece o diagnóstico, que é oferta industrial', () => {
    // Medição na planta é a oferta do industrial; num campo que atende os três
    // públicos, ela fura a regra de ouro.
    const cliente = INTEREST_TYPE_OPTIONS.find((o) => o.value === 'b2b')!;
    expect(cliente.label).not.toMatch(/diagn[óo]stico/i);
  });

  it('o `value` segue "b2b" — é contrato com a API e com o Betinna', () => {
    expect(INTEREST_TYPE_OPTIONS.map((o) => o.value)).toEqual(['b2b', 'representante']);
  });
});
