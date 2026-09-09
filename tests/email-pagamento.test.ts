import { describe, it, expect } from 'vitest';
import {
  JANELA_SILENCIO_MS,
  assuntoPagamento,
  deveAvisarPagamento,
  htmlPagamento,
  textoPagamento,
} from '@/lib/email/pagamento-confirmado';

// =============================================================================
// E-mail de pagamento confirmado.
//
// Ele existe por UM motivo: dizer que o dinheiro entrou, no caso em que o
// cliente ficou sem sinal nenhum — o PIX pago depois de sair da página. Os
// testes protegem as duas coisas que, se quebrarem, transformam o e-mail em
// problema: sair quando não devia, e prometer envio que não aconteceu.
// =============================================================================

const BASE = {
  numero: 'SB26086E6ACW',
  primeiroNome: 'Marcos',
  valorCentavos: 435000,
  formaPagamento: 'PIX',
};

describe('pagamento confirmado — a regra do intervalo', () => {
  const criadoEm = new Date('2026-09-09T12:00:00Z');

  it('NÃO manda quando a confirmação vem logo depois (cartão)', () => {
    // O e-mail de pedido acabou de sair; este seria o segundo em um minuto.
    expect(
      deveAvisarPagamento({
        criadoEm,
        confirmadoEm: new Date(criadoEm.getTime() + 40 * 1000),
      }),
    ).toBe(false);
  });

  it('manda quando o pagamento demora (PIX pago depois)', () => {
    expect(
      deveAvisarPagamento({
        criadoEm,
        confirmadoEm: new Date(criadoEm.getTime() + 35 * 60 * 1000),
      }),
    ).toBe(true);
  });

  it('a fronteira é a janela, e ela é inclusiva', () => {
    const noLimite = new Date(criadoEm.getTime() + JANELA_SILENCIO_MS);
    expect(deveAvisarPagamento({ criadoEm, confirmadoEm: noLimite })).toBe(true);
    expect(
      deveAvisarPagamento({ criadoEm, confirmadoEm: new Date(noLimite.getTime() - 1) }),
    ).toBe(false);
  });

  it('aceita a data como string, que é como ela chega do banco', () => {
    expect(
      deveAvisarPagamento({
        criadoEm: '2026-09-09T12:00:00Z',
        confirmadoEm: new Date('2026-09-09T13:00:00Z'),
      }),
    ).toBe(true);
  });

  it('sem data confiável, MANDA — silêncio depois de pagar é o pior erro', () => {
    // Data ausente ou ilegível significa consulta do pedido falhando. Entre um
    // e-mail a mais e alguém sem resposta depois de pagar, o e-mail a mais.
    expect(deveAvisarPagamento({ criadoEm: null })).toBe(true);
    expect(deveAvisarPagamento({ criadoEm: undefined })).toBe(true);
    expect(deveAvisarPagamento({ criadoEm: 'não é data' })).toBe(true);
  });
});

describe('pagamento confirmado — conteúdo', () => {
  it('leva o número no assunto, pra ficar junto do e-mail do pedido na busca', () => {
    expect(assuntoPagamento(BASE.numero)).toContain('SB26086E6ACW');
  });

  it('mostra o valor e a forma de pagamento', () => {
    const html = htmlPagamento(BASE);
    expect(html).toContain('4.350,00');
    expect(html).toContain('PIX');
    expect(textoPagamento(BASE)).toContain('4.350,00');
  });

  it('leva o número e o link de acompanhar', () => {
    expect(htmlPagamento(BASE)).toMatch(/href="https?:\/\/[^"]*\/pedido\/SB26086E6ACW"/);
    expect(textoPagamento(BASE)).toMatch(/\/pedido\/SB26086E6ACW/);
  });

  it('NÃO promete envio — pagar não é despachar', () => {
    // Neste momento o pedido ainda está "recebido": separação, nota e etiqueta
    // vêm depois. Prometer aqui vira reclamação dois dias depois.
    const proibido = /est[áa] a caminho|foi enviado|foi despachado|j[áa] enviamos|saiu para entrega hoje/i;
    expect(htmlPagamento(BASE)).not.toMatch(proibido);
    expect(textoPagamento(BASE)).not.toMatch(proibido);
  });

  it('é mais curto que o e-mail de pedido: não repete os itens', () => {
    // Repetir a lista faria dele um segundo comprovante, e aí a pessoa precisa
    // comparar dois e-mails pra saber qual vale.
    expect(htmlPagamento(BASE)).not.toContain('Resumo');
  });

  it('escapa o nome — ele vem de formulário', () => {
    const html = htmlPagamento({ ...BASE, primeiroNome: '<script>x</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('funciona sem nome e sem forma de pagamento', () => {
    const html = htmlPagamento({ numero: BASE.numero, valorCentavos: 435000 });
    expect(html).toContain('Olá!');
    expect(html).toContain('SB26086E6ACW');
  });
});
