import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  masterBlockProductSchema,
  masterBlockProdutoNiSchema,
} from '@/lib/seo/structured-data';

// =============================================================================
// O SITE ESTAVA CERTO E INVISÍVEL.
//
// Medido pela sessão do Blog em 12/09, com SERP real + Planejador do Google:
//
//   protetor de surto (família)   ~28.400 buscas/mês — o maior bolsão de
//                                 intenção de COMPRA do não-industrial
//   supressor de surtos                720
//   supressor de transientes            70
//
// E a cauda do "supressor" decide: `supressor de surto para contator`,
// `diodo supressor de surto`, `bloco supressor de surto weg`. Isso é
// COMPONENTE DE PAINEL — snubber RC, diodo TVS. Não é a categoria do Master
// Block. Quem digita "supressor" quer, em boa parte dos casos, uma peça que vai
// DENTRO do painel, não um equipamento que protege a instalação.
//
// ⚠️ "Supressor" NÃO é erro técnico — o Master Block É um supressor de surtos.
// O que pertence a outro produto é a CAUDA DE BUSCA da palavra, não a palavra.
// O problema sempre foi descoberta, nunca precisão. Guarda escrita com isso em
// mente: ela NÃO proíbe "supressor", exige que o termo do consumidor exista
// onde a busca acontece.
//
// A regra é da master /plano-somatec (12/09), e o site executa:
//
//   título · H1 · meta description · og · /llms.txt   → "protetor de surto"
//   corpo                                             → "supressor de surtos e
//                                                        transientes", "DPS
//                                                        Classe III"
//   industrial (/orcamento-industrial, blog técnico)  → técnico continua
//
// O que esta guarda protege é o tipo de regressão que não dá erro nenhum:
// alguém "melhora" um título, volta pro vocabulário da marca, e o site
// desaparece da única busca com intenção de compra que ele tem.
// =============================================================================

const ler = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

/** Só o bloco `export const metadata` — é o campo de busca. */
function metadata(arquivo: string): string {
  const m = ler(arquivo).match(/export const metadata[\s\S]*?\n\}\)?;\n/);
  expect(m, `${arquivo} precisa ter um bloco de metadata`).not.toBeNull();
  return m![0];
}

describe('as LPs não-industriais falam a língua de quem compra', () => {
  it.each(['src/app/protecao-residencial/page.tsx', 'src/app/protecao-comercial/page.tsx'])(
    '%s tem "protetor de surto" no título E na description',
    (arquivo) => {
      const meta = metadata(arquivo);
      const titulo = meta.match(/title:\s*\{\s*absolute:\s*'([^']+)'/)?.[1] ?? '';
      const descricao = meta.match(/description:\s*\n?\s*'([^']+)'/)?.[1] ?? '';

      expect(titulo.toLowerCase(), 'o título é o que aparece no resultado').toContain(
        'protetor de surto',
      );
      // A description não é decoração: é a linha que o Google mostra embaixo do
      // título. Título certo com description no vocabulário da marca entrega
      // metade da correspondência.
      expect(descricao.toLowerCase()).toContain('protetor de surto');
    },
  );
});

describe('/produtos — o catálogo, que é a página com chance de ranquear', () => {
  const meta = metadata('src/app/produtos/page.tsx');

  it('o título carrega o termo do consumidor', () => {
    expect(meta.toLowerCase()).toMatch(/title:\s*'[^']*protetor de surto/);
  });

  it('e a description mantém o termo técnico junto — os dois convivem', () => {
    // O técnico legitima (é o que o especificador procura e o que a norma usa),
    // o do consumidor faz achar. Trocar um pelo outro perde metade do público:
    // esta página serve os DOIS motores.
    const d = meta.match(/description:\s*\n?\s*'([^']+)'/)?.[1] ?? '';
    expect(d.toLowerCase()).toContain('protetor de surto');
    expect(d.toLowerCase()).toContain('supressor de surtos e transientes');
    expect(d).toContain('DPS Classe III');
  });
});

describe('/llms.txt e /llms-full.txt — o que a IA lê pra dizer o que a Somatec faz', () => {
  // Precedente real: em 07/09 o /llms.txt foi publicado com uma frase da oferta
  // EXTINTA, copiada de material interno. Erro nesta superfície não aparece em
  // métrica nenhuma — só na resposta que o modelo dá pra quem pergunta. Se ela
  // descrever o produto pela palavra cuja cauda é "diodo supressor", o modelo
  // pode ancorar a empresa na categoria errada.
  it.each(['src/app/llms.txt/route.ts', 'src/app/llms-full.txt/route.ts'])(
    '%s descreve a empresa como fabricante de protetor de surto',
    (arquivo) => {
      const fonte = ler(arquivo).toLowerCase();
      expect(fonte).toContain('protetor de surto');
    },
  );
});

describe('🔀 Product: DOIS schemas, porque um não atende os dois públicos', () => {
  const ni = masterBlockProdutoNiSchema('/protecao-residencial') as Record<string, unknown>;
  const ind = masterBlockProductSchema() as Record<string, unknown>;

  it('o NI se chama pelo termo do consumidor', () => {
    expect(String(ni.name).toLowerCase()).toContain('protetor de surto');
    expect(String(ni.category).toLowerCase()).toContain('protetor de surto');
  });

  it('o industrial se chama pelo termo do especificador', () => {
    expect(String(ind.name).toLowerCase()).toContain('supressor de surtos e transientes');
  });

  it('⚠️ cada um declara o vocabulário do OUTRO em alternateName', () => {
    // É a ponte. Sem ela, o schema NI perde a correspondência quando a busca vem
    // pelo termo técnico, e o industrial some quando vem pelo termo do
    // consumidor — e os dois descrevem a MESMA peça, então isso seria perda
    // gratuita. É também o que impede a divisão de virar duas verdades.
    expect(String(ni.alternateName).toLowerCase()).toContain('supressor de surtos e transientes');
    expect(String(ind.alternateName).toLowerCase()).toContain('protetor de surto');
  });

  it('e cada um aponta pra sua própria URL', () => {
    expect(String(ni.url)).toContain('/protecao-residencial');
    expect(String(ind.url)).toContain('/produtos');
  });

  it('a ficha técnica é a MESMA nos dois — muda o nome, não o produto', () => {
    // A divisão é de vocabulário. Se um dia as propriedades divergirem, o site
    // passa a descrever dois produtos onde existe um.
    expect(ni.additionalProperty).toEqual(ind.additionalProperty);
    expect(ni.brand).toEqual(ind.brand);
    expect(ni.description).toEqual(ind.description);
  });
});

describe('⛔ as LPs NI usam o schema NI, não o industrial', () => {
  // Um "conserto" de import volta o industrial pras duas LPs sem quebrar build,
  // sem quebrar tipo e sem mudar um pixel da tela.
  it.each(['src/app/protecao-residencial/page.tsx', 'src/app/protecao-comercial/page.tsx'])(
    '%s',
    (arquivo) => {
      const fonte = ler(arquivo);
      expect(fonte).toContain('masterBlockProdutoNiSchema');
      expect(fonte).not.toMatch(/masterBlockProductSchema\s*\(/);
    },
  );
});
