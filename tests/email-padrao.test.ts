import { describe, it, expect } from 'vitest';
import { htmlPedido } from '@/lib/email/pedido-confirmado';
import { htmlPagamento } from '@/lib/email/pagamento-confirmado';

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
