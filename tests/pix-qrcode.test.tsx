import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { PixQrCode } from '@/components/tools/PixQrCode';

// =============================================================================
// QR DO PIX NA PRÓPRIA PÁGINA — decisão do Léo, 23/09/2026.
//
// O que se protege aqui não é o desenho do QR; é o cliente NUNCA ficar sem
// caminho pra pagar. A cobrança já existe quando o QR é buscado, então cada
// jeito de falhar tem a mesma consequência: pedido cobrado e ninguém consegue
// pagar.
//
//   1. o QR falha e derruba a resposta   → pedido existe, tela não abre
//   2. o QR falha e some o link também   → tela abre sem caminho nenhum
//   3. QR sem copia-e-cola               → quem está no computador trava
//   4. QR no CARTÃO                      → não existe, e pedir seria erro de
//      integração — cartão vai pra página do Asaas por causa de PCI-DSS
//
// ⛔ E o silencioso: QR sem validade. Cobrança PIX expira; sem dizer até quando
// vale, quem volta no dia seguinte encontra um código morto e conclui que o
// site quebrou.
// =============================================================================

const fonte = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
const B64 = 'iVBORw0KGgoAAAANSUhEUg==';
const CODIGO = '00020126580014BR.GOV.BCB.PIX0136chave-exemplo5204000053039865802BR';

describe('o que a tela mostra', () => {
  it('a imagem sai como data: URI, montada aqui e não guardada assim', () => {
    const html = renderToStaticMarkup(<PixQrCode imagemBase64={B64} codigo={CODIGO} />);
    expect(html).toContain(`src="data:image/png;base64,${B64}"`);
  });

  it('🔴 o copia-e-cola aparece NA TELA, não só no botão', () => {
    // É o plano B de quando a área de transferência falha — navegador antigo,
    // permissão negada, página sem HTTPS. Sem o código visível, esses casos
    // ficam sem saída no computador.
    const html = renderToStaticMarkup(<PixQrCode imagemBase64={B64} codigo={CODIGO} />);
    expect(html).toContain(CODIGO);
    expect(html).toMatch(/Copiar código PIX/);
  });

  it('o QR tem texto alternativo — imagem sem alt é um beco pra leitor de tela', () => {
    const html = renderToStaticMarkup(<PixQrCode imagemBase64={B64} codigo={CODIGO} />);
    expect(html).toMatch(/alt="QR Code do PIX[^"]*"/);
  });

  it('🔴 diz como a confirmação chega — o QR não avisa nada sozinho', () => {
    const html = renderToStaticMarkup(<PixQrCode imagemBase64={B64} codigo={CODIGO} />);
    expect(html).toMatch(/confirmação chega por e-mail e WhatsApp/);
  });
});

describe('validade', () => {
  it('mostra até quando vale quando o gateway informa', () => {
    const html = renderToStaticMarkup(
      <PixQrCode imagemBase64={B64} codigo={CODIGO} expiraEm="2026-09-24T18:30:00-03:00" />,
    );
    expect(html).toMatch(/Este código vale até/);
  });

  it('🔴 sem data do gateway, NÃO inventa prazo', () => {
    // Prometer validade que ninguém garantiu é pior que não prometer: o cliente
    // confia no número e volta quando o código já morreu.
    for (const v of [undefined, null, '', 'não é data']) {
      const html = renderToStaticMarkup(
        <PixQrCode imagemBase64={B64} codigo={CODIGO} expiraEm={v as string | null} />,
      );
      expect(html, `expiraEm=${JSON.stringify(v)}`).not.toMatch(/vale até/);
    }
  });
});

describe('🔴 o cliente nunca fica sem caminho', () => {
  const asaas = fonte('src/lib/pagamento/asaas.ts');
  const rota = fonte('src/app/api/pedidos/route.ts');
  const checkout = fonte('src/components/tools/CheckoutNI.tsx');

  it('buscar o QR NUNCA lança — a cobrança já existe quando ele roda', () => {
    const i = asaas.indexOf('export async function buscarPixQrCode');
    expect(i).toBeGreaterThan(0);
    const corpo = asaas.slice(i, i + 1200);
    expect(corpo).toContain('try {');
    expect(corpo).toMatch(/catch[\s\S]{0,200}return null/);
  });

  it('QR ausente NÃO tira o link do gateway', () => {
    // Os dois vêm do mesmo lugar, e o link é o caminho de antes. Se um `return`
    // de erro zerasse os dois, a tela abriria sem nada clicável.
    expect(rota).toMatch(/SEM_COBRANCA = \{ url: null, pix: null \}/);
    expect(checkout).toMatch(/\{urlPagamento && \(/);
  });

  it('🔴 o QR só é buscado no PIX — no cartão nem se pede', () => {
    expect(rota).toMatch(/escolhida === 'pix' \? await buscarPixQrCode/);
  });

  it('o link vira secundário quando há QR, e principal quando não há', () => {
    expect(checkout).toMatch(/Prefiro pagar na página do banco/);
    expect(checkout).toMatch(/Pagar agora/);
  });
});

describe('a leitura da forma de pagamento parou de divergir', () => {
  it('🔴 a cobrança usa o MESMO parser do desconto', () => {
    // Antes a cobrança decidia por `includes("cart")` e o desconto por
    // igualdade estrita: "PIX " com espaço cobrava PIX e não dava os 6%.
    const rota = fonte('src/app/api/pedidos/route.ts');
    expect(rota).toMatch(/formaPagamentoDe\(dados\.formaPagamento\) \?\? 'pix'/);
    // Sem comentário: o comentário que EXPLICA a troca cita o padrão antigo, e
    // a primeira versão desta guarda reprovou a própria explicação.
    const codigo = rota
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n');
    expect(codigo).not.toMatch(/includes\('cart'\)/);
  });
});

describe('copiar', () => {
  const original = globalThis.navigator;
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true });
  });

  it('o componente não quebra quando a área de transferência não existe', () => {
    // `renderToStaticMarkup` não clica, mas garante que o módulo não assume
    // `navigator.clipboard` no topo — assumir ali quebraria o SSR inteiro.
    expect(() =>
      renderToStaticMarkup(<PixQrCode imagemBase64={B64} codigo={CODIGO} />),
    ).not.toThrow();
    const src = fonte('src/components/tools/PixQrCode.tsx');
    expect(src).toMatch(/try \{[\s\S]{0,200}clipboard\.writeText/);
  });
});
