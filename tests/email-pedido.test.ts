import { describe, it, expect } from 'vitest';
import { assuntoPedido, htmlPedido, textoPedido } from '@/lib/email/pedido-confirmado';

// =============================================================================
// E-mail de confirmação do pedido.
//
// Este e-mail existe por UM motivo: entregar o número. Quem fecha o pedido e
// sai da página perde o número da tela, e a única saída vira perguntar no
// WhatsApp. Os testes protegem exatamente isso.
// =============================================================================

const BASE = {
  numero: 'SB26086E6ACW',
  nome: 'Marcos Fictício da Silva',
  itens: [
    { descricao: 'Quadro de entrada', modelo: 'MB-03', quantidade: 1, precoCentavos: 189000 },
    { descricao: 'Quadro da piscina', modelo: 'MB-01', quantidade: 1, precoCentavos: 98000 },
  ],
  totalCentavos: 287000,
  freteCentavos: 0,
  formaPagamento: 'PIX',
  cidade: 'Valinhos',
  uf: 'SP',
};

describe('e-mail do pedido — o número', () => {
  it('vai no assunto, pra achar pela busca da caixa de entrada', () => {
    expect(assuntoPedido(BASE.numero)).toContain('SB26086E6ACW');
  });

  it('aparece no HTML e no texto', () => {
    expect(htmlPedido(BASE)).toContain('SB26086E6ACW');
    expect(textoPedido(BASE)).toContain('SB26086E6ACW');
  });

  it('o link de acompanhar aponta pro pedido certo', () => {
    expect(htmlPedido(BASE)).toMatch(/href="https?:\/\/[^"]*\/pedido\/SB26086E6ACW"/);
    expect(textoPedido(BASE)).toMatch(/\/pedido\/SB26086E6ACW/);
  });
});

describe('e-mail do pedido — conteúdo', () => {
  it('lista os itens com preço e o total', () => {
    const html = htmlPedido(BASE);
    expect(html).toContain('Quadro de entrada');
    expect(html).toContain('MB-03');
    expect(html).toContain('Quadro da piscina');
    expect(html).toMatch(/2\.870,00/); // total
  });

  it('frete zero aparece como "Grátis", não como R$ 0,00', () => {
    expect(htmlPedido(BASE)).toContain('Grátis');
    expect(textoPedido(BASE)).toContain('grátis');
  });

  it('trata o cliente pelo primeiro nome', () => {
    expect(htmlPedido(BASE)).toContain('Olá, Marcos!');
    expect(textoPedido(BASE)).toContain('Olá, Marcos!');
  });

  it('sempre tem versão em texto de verdade, não vazia', () => {
    // Cliente que bloqueia HTML, leitor de tela e filtro de spam olham isto.
    const texto = textoPedido(BASE);
    expect(texto.length).toBeGreaterThan(150);
    expect(texto).not.toMatch(/<[a-z]/i);
  });
});

describe('e-mail do pedido — o que quebraria na caixa de entrada', () => {
  it('escapa o que veio do formulário', () => {
    // Nome vem de campo aberto: um "<" cru quebra o e-mail inteiro.
    const html = htmlPedido({
      ...BASE,
      nome: '<script>alert(1)</script>',
      itens: [{ descricao: 'Quadro <b>x</b>', modelo: null, quantidade: 1, precoCentavos: 100 }],
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;');
  });

  it('não usa flexbox nem grid — Outlook não renderiza', () => {
    const html = htmlPedido(BASE);
    expect(html).not.toMatch(/display:\s*flex/i);
    expect(html).not.toMatch(/display:\s*grid/i);
  });

  it('não depende de CSS externo nem de classe', () => {
    const html = htmlPedido(BASE);
    expect(html).not.toMatch(/<link[^>]+stylesheet/i);
    expect(html).not.toMatch(/class=/);
  });

  it('tem pré-cabeçalho — senão a lista de e-mails mostra lixo', () => {
    expect(htmlPedido(BASE)).toMatch(/Seu número de pedido é SB26086E6ACW/);
  });

  it('aguenta pedido sem itens e sem cidade', () => {
    const magro = { numero: 'SB2608AAAAAA', nome: 'Ana', itens: [], totalCentavos: 0, freteCentavos: 0 };
    expect(() => htmlPedido(magro)).not.toThrow();
    expect(() => textoPedido(magro)).not.toThrow();
    expect(htmlPedido(magro)).toContain('SB2608AAAAAA');
  });
});
