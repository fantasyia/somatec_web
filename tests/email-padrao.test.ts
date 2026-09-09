import { describe, it, expect } from 'vitest';
import { htmlPedido } from '@/lib/email/pedido-confirmado';
import { htmlPagamento } from '@/lib/email/pagamento-confirmado';
import { assuntoInterno, htmlInterno, textoInterno } from '@/lib/email/pagamento-interno';

// =============================================================================
// O PADRÃO, travado para TODO e-mail do site.
//
// Estes testes não são sobre gosto. Cada um trava um jeito conhecido de o
// e-mail chegar quebrado na caixa do cliente — e todos já aconteceram de
// verdade. O padrão canônico vive em:
//   leo-Skills-master/clients/somatec/reports/email/layout-transacional/
//
// Rodam sobre os DOIS e-mails do site: se alguém criar um terceiro sem passar
// pelo `layout.ts`, o jeito de descobrir é acrescentar ele aqui.
// =============================================================================

const PEDIDO = htmlPedido({
  numero: 'SB26086E6ACW',
  nome: 'Marcos Fictício da Silva',
  itens: [{ descricao: 'Quadro de entrada', modelo: 'MB-03', quantidade: 1, precoCentavos: 189000 }],
  totalCentavos: 189000,
  freteCentavos: 0,
  formaPagamento: 'PIX',
  cidade: 'Valinhos',
  uf: 'SP',
});

const PAGAMENTO = htmlPagamento({
  numero: 'SB26086E6ACW',
  primeiroNome: 'Marcos',
  valorCentavos: 435000,
  formaPagamento: 'PIX',
});

const EMAILS: Array<[string, string]> = [
  ['pedido recebido', PEDIDO],
  ['pagamento confirmado', PAGAMENTO],
];

describe.each(EMAILS)('padrão do e-mail — %s', (_nome, html) => {
  it('o botão tem a cor no ATRIBUTO bgcolor, não só em CSS', () => {
    // Sanitizador de cliente corta CSS. Com o rótulo BRANCO, o botão sumia no
    // branco sem deixar rastro — aconteceu em 07/09. Atributo sobrevive.
    expect(html).toMatch(/bgcolor="#F39200"/);
  });

  it('não usa o atalho `background` na cor do botão', () => {
    // O atalho é o primeiro a cair na sanitização; `background-color` resiste.
    expect(html).not.toMatch(/background:\s*#F39200/i);
    expect(html).toMatch(/background-color:#F39200/);
  });

  it('o botão é célula de tabela, não `<a>` solto', () => {
    // Outlook ignora `padding` em link inline: o botão colapsa e vira texto
    // sublinhado no meio do e-mail.
    expect(html).toMatch(/<td bgcolor="#F39200"[^>]*>\s*<a /);
  });

  it('a barra do topo é imagem, com navy sólido por trás', () => {
    // Textura e logo assados na imagem (Outlook não renderiza gradiente CSS), e
    // background-color atrás: imagem bloqueada mostra navy, não faixa branca.
    expect(html).toMatch(/background-color:#00416E;?"[^>]*>\s*<img src="[^"]*\/email\/bar-navy\.png"/);
    expect(html).toMatch(/alt="Somatec Blocking"/);
  });

  it('não pede webfont — cliente de e-mail não baixa fonte', () => {
    expect(html).not.toMatch(/fonts\.googleapis|@import|<link[^>]+stylesheet/i);
    expect(html).toContain("'Segoe UI',Roboto,Helvetica,Arial,sans-serif");
  });

  it('não usa flexbox, grid nem classe', () => {
    expect(html).not.toMatch(/display:\s*flex/i);
    expect(html).not.toMatch(/display:\s*grid/i);
    expect(html).not.toMatch(/class=/);
  });

  it('o rodapé identifica o fornecedor — razão social, CNPJ, endereço e e-mail', () => {
    // O site vende direto; o Decreto 7.962/2013 exige identificação. E o e-mail
    // público é UM só: comercial@. O somatec@ não é canal e já vazou pra rodapé.
    expect(html).toContain('16.774.052/0001-55');
    expect(html).toContain('Somatecblocking UF Eletroeletrônicos LTDA');
    expect(html).toContain('Av. Fagundes Filho, 145');
    expect(html).toContain('comercial@somatecblocking.com.br');
    expect(html).not.toContain('somatec@somatecblocking.com.br');
  });

  it('diz por que a pessoa recebeu — é o que separa esperado de denúncia', () => {
    expect(html).toMatch(/Você recebeu este e-mail porque/);
  });

  it('tem pré-cabeçalho escondido, senão a lista mostra o começo do HTML', () => {
    expect(html).toMatch(/<div style="display:none[^"]*">[^<]{20,}<\/div>/);
  });
});

// =============================================================================
// O aviso INTERNO usa a mesma casca, mas não é e-mail de consumidor: a
// identificação legal (razão social, CNPJ, endereço) não entra. Por isso ele
// tem bloco próprio, e não entra no `describe.each` acima.
// =============================================================================

const INTERNO = htmlInterno({
  numeroPedido: 'SB26086E6ACW',
  evento: 'PAYMENT_CONFIRMED',
  cobrancaId: 'pay_93lhfvc291h2hi1a',
  pago: true,
  valorCentavos: 72500,
  parcelamento: { totalCentavos: 435000, parcelas: 6 },
});

describe('padrão do e-mail — aviso interno de pagamento', () => {
  it('usa a mesma casca: barra com logo, botão em tabela com bgcolor', () => {
    expect(INTERNO).toMatch(/background-color:#00416E;?"[^>]*>\s*<img src="[^"]*\/email\/bar-navy\.png"/);
    expect(INTERNO).toMatch(/<td bgcolor="#F39200"[^>]*>\s*<a /);
    expect(INTERNO).toContain("'Segoe UI',Roboto,Helvetica,Arial,sans-serif");
    expect(INTERNO).not.toMatch(/display:\s*flex|display:\s*grid|class=/);
  });

  it('NÃO leva a identificação legal — ela é pro consumidor, não pra dentro de casa', () => {
    expect(INTERNO).not.toContain('16.774.052/0001-55');
    expect(INTERNO).not.toContain('Av. Fagundes Filho');
  });

  it('diz o que fazer, não só o que aconteceu', () => {
    expect(INTERNO).toMatch(/separação/);
    expect(INTERNO).toMatch(/faturamento/);
  });

  it('mostra o TOTAL da venda, não o valor da parcela', () => {
    // Numa venda de R$ 4.350 em 6x, "R$ 725,00" faz quem lê concluir que entrou
    // menos do que entrou — ou que existem seis pedidos.
    expect(INTERNO).toContain('4.350,00');
    expect(INTERNO).toMatch(/6x de[^<]*725,00/);
    expect(assuntoInterno({ numeroPedido: 'SB1', evento: 'x', cobrancaId: null, pago: true, valorCentavos: 72500, parcelamento: { totalCentavos: 435000, parcelas: 6 } })).toContain('4.350,00');
  });

  it('leva os dados do gateway, pra conferir na conta quando não bater', () => {
    expect(INTERNO).toContain('PAYMENT_CONFIRMED');
    expect(INTERNO).toContain('pay_93lhfvc291h2hi1a');
  });

  it('o botão abre o pedido', () => {
    expect(INTERNO).toMatch(/href="https?:\/\/[^"]*\/pedido\/SB26086E6ACW"/);
  });

  it('a versão em texto é texto de verdade', () => {
    const t = textoInterno({
      numeroPedido: 'SB26086E6ACW',
      evento: 'PAYMENT_CONFIRMED',
      cobrancaId: null,
      pago: false,
      valorCentavos: 10000,
    });
    expect(t).not.toMatch(/<[a-z]/i);
    expect(t).toMatch(/confirmar com o cliente/);
  });
});
