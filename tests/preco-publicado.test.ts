import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MASTER_BLOCK_MODELS, formatBRL } from '@/lib/constants/masterblock';
import {
  masterBlockProductSchema,
  masterBlockProdutoNiSchema,
} from '@/lib/seo/structured-data';

// =============================================================================
// O PREÇO NA PÁGINA — e a armadilha de publicá-lo numa página de DOIS motores.
//
// Léo autorizou em 12/09 pôr o preço na `/produtos`. O preço já era público
// (o checkout mostra valor e total na tela); o que faltava era ele estar numa
// página INDEXÁVEL, com `offers` no JSON-LD — que é o que habilita o card com
// preço no Google, o formato com que Clamper, Intelbras e Mercado Livre ocupam
// aquele resultado.
//
// 🔴 O PERIGO: os 12 modelos servem os dois motores, mas o preço só vale pra um.
//
//   comércio e residência → COMPRA direta
//   indústria             → LOCAÇÃO
//
// E "oferecer a compra do equipamento no industrial" é oferta que **morreu em
// 25/08**. Uma coluna "Preço" sem qualificação publica a oferta morta por
// implicação: o visitante industrial lê um preço de compra que não existe pra
// ele — sem nenhuma frase proibida aparecer em lugar nenhum, que é como esse
// tipo de erro sempre passa pelas guardas.
//
// Por isso a qualificação é testada como parte do preço, não como enfeite:
// preço sem ela não pode subir.
// =============================================================================

const PAGINA = 'src/app/produtos/page.tsx';
const fonte = readFileSync(resolve(process.cwd(), PAGINA), 'utf-8');

describe('⛔ a qualificação que impede a tabela de publicar oferta morta', () => {
  it('a COLUNA diz "compra direta" — quem lê tabela não desce até o rodapé', () => {
    expect(fonte).toMatch(/Preço\s*<span[^>]*>\s*\(compra direta\)/);
  });

  it('e a página diz, por extenso, que na indústria o modelo é locação', () => {
    expect(fonte).toMatch(/compra direta, para comércio e residência/i);
    expect(fonte).toMatch(/na indústria o modelo é locação/i);
  });

  it('com caminho pra oferta industrial VIGENTE, não pra um preço', () => {
    // "estudo, projeto e proposta sem custo" é a oferta de entrada que vale
    // desde 04/09. Mandar o industrial pro checkout seria vender equipamento
    // pra quem aluga.
    expect(fonte).toContain('/orcamento-industrial');
    expect(fonte).toMatch(/estudo, projeto e proposta sem custo/i);
  });
});

describe('a tabela mostra o preço dos 12 modelos', () => {
  it('usa o MESMO formatador e a MESMA fonte que o checkout cobra', () => {
    // Tabela e carrinho divergirem em preço é a pior falha possível aqui: o
    // cliente decide por um número e paga outro. Derivar de `m.preco` com
    // `formatBRL` é o que garante que não há dois números.
    expect(fonte).toContain('formatBRL(m.preco)');
    expect(fonte).not.toMatch(/R\$\s?\d{1,3}\.\d{3}/); // nenhum preço digitado à mão
  });

  it('o catálogo tem 12 modelos, todos com preço', () => {
    expect(MASTER_BLOCK_MODELS).toHaveLength(12);
    for (const m of MASTER_BLOCK_MODELS) {
      expect(m.preco, `${m.model} sem preço`).toBeGreaterThan(0);
    }
  });

  it('o formatador não inventa centavos em preço de tabela', () => {
    // ⚠️ `toLocaleString('pt-BR')` separa "R$" do número com espaço NÃO
    // QUEBRÁVEL (U+00A0), não com espaço comum. Comparar com string literal
    // falha exibindo dois textos idênticos na tela — meia hora de olhar pra
    // "expected 'R$ 4.350' to be 'R$ 4.350'". Normalizo o espaço.
    const normal = (v: string) => v.replace(/\u00A0/g, ' ');
    expect(normal(formatBRL(4350))).toBe('R$ 4.350');
    expect(normal(formatBRL(83750))).toBe('R$ 83.750');
  });
});

describe('offers no JSON-LD — derivado do catálogo, nunca digitado', () => {
  const precos = MASTER_BLOCK_MODELS.map((m) => m.preco);
  const esperado = {
    '@type': 'AggregateOffer',
    priceCurrency: 'BRL',
    lowPrice: Math.min(...precos),
    highPrice: Math.max(...precos),
    offerCount: precos.length,
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'Organization', name: 'Somatec Blocking' },
  };

  it.each([
    ['catálogo (/produtos)', masterBlockProductSchema()],
    ['NI (/protecao-residencial)', masterBlockProdutoNiSchema('/protecao-residencial')],
  ])('%s carrega a faixa de preço', (_nome, schema) => {
    expect((schema as Record<string, unknown>).offers).toEqual(esperado);
  });

  it('é AggregateOffer, não Offer — são 12 preços, não um', () => {
    // Um `Offer` único obrigaria a eleger UM preço pra representar a linha, e
    // qualquer escolha seria mentira sobre os outros onze. O que o Google monta
    // a partir da faixa é o "a partir de R$ 4.350".
    const o = (masterBlockProductSchema() as { offers: { '@type': string } }).offers;
    expect(o['@type']).toBe('AggregateOffer');
  });

  it('⚠️ o preço do schema BATE com o da tabela — divergir é penalizado', () => {
    // Structured data que não corresponde ao conteúdo visível é violação de
    // política do Google. E é invisível: os dois textos vivem longe um do
    // outro, então só um teste amarra.
    const o = (masterBlockProductSchema() as { offers: { lowPrice: number; highPrice: number } })
      .offers;
    const naTabela = MASTER_BLOCK_MODELS.map((m) => m.preco);
    expect(o.lowPrice).toBe(Math.min(...naTabela));
    expect(o.highPrice).toBe(Math.max(...naTabela));
  });
});
