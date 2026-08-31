import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { b2bSchema } from '@/lib/forms/schemas';

// =============================================================================
// `formulario` é o slug pelo qual o Betinna ROTEIA o lead. Três ferramentas com
// jornadas opostas mandavam o mesmo 'calculadora', e a única coisa que as
// separava era o `segment` — texto livre. Condição de fluxo comparando texto
// livre quebra em silêncio no dia que alguém troca um hífen (já mordeu, no card
// de etapa comparada por nome).
//
// Estes testes travam os dois lados do contrato: o vocabulário fechado e o que
// o site realmente envia. Slug novo que não passe pelo enum é recusado no
// envio — o lead não some calado.
// =============================================================================

/** Extrai o enum do campo `formulario` direto do schema que a API usa. */
function slugsDoSchema(): string[] {
  const campo = b2bSchema.shape.formulario;
  // ZodOptional<ZodEnum> — o enum fica em _def.innerType
  const enumDef = (campo as unknown as { _def: { innerType: { options: string[] } } })._def.innerType;
  return [...enumDef.options].sort();
}

const ESPERADO = [
  // ⚠️ Acrescentado em 31/08 — o BETINNA PRECISA SABER deste slug pra rotear.
  // Enquanto o fluxo de nutrição do lado de lá não conhecer
  // 'checkout-ni-abandono', o lead chega e fica parado sem ninguém acionar.
  // Está registrado no card do lead de abandono.
  'checkout-ni-abandono',
  'checkout-ni-orcamento',
  'checkout-ni-pedido',
  'contato',
  'custo-de-parada',
  'orcamento-industrial',
  'representante',
].sort();

describe('contrato do campo `formulario`', () => {
  it('o vocabulário é exatamente o combinado com o Betinna', () => {
    expect(slugsDoSchema()).toEqual(ESPERADO);
  });

  it('não sobrou o valor genérico que juntava três ferramentas', () => {
    // 'calculadora' cobria orçamento industrial, checkout NI e custo de parada
    // ao mesmo tempo; 'seletor' morreu junto com a página do seletor de modelo.
    expect(slugsDoSchema()).not.toContain('calculadora');
    expect(slugsDoSchema()).not.toContain('seletor');
  });

  it('o CheckoutNI separa PEDIDO de ORÇAMENTO', () => {
    // São jornadas opostas do lado do CRM: um espera link de pagamento, o outro
    // espera um orçamento. Mesmo slug pros dois deixaria o fluxo adivinhar.
    const slugs = slugsDoSchema();
    expect(slugs).toContain('checkout-ni-pedido');
    expect(slugs).toContain('checkout-ni-orcamento');
  });
});

describe('o que o site ENVIA bate com o vocabulário', () => {
  function arquivosFonte(dir: string, out: string[] = []): string[] {
    for (const nome of readdirSync(resolve(process.cwd(), dir))) {
      const rel = `${dir}/${nome}`;
      if (statSync(resolve(process.cwd(), rel)).isDirectory()) arquivosFonte(rel, out);
      else if (/\.tsx?$/.test(nome)) out.push(rel);
    }
    return out;
  }

  /** Todo literal `formulario: '<x>'` no código do site. */
  function slugsEnviados(): { arquivo: string; slug: string }[] {
    const achados: { arquivo: string; slug: string }[] = [];
    for (const arquivo of [...arquivosFonte('src/components'), ...arquivosFonte('src/lib')]) {
      const fonte = readFileSync(resolve(process.cwd(), arquivo), 'utf-8');
      for (const m of fonte.matchAll(/formulario:\s*'([a-z-]+)'/g)) {
        achados.push({ arquivo, slug: m[1] });
      }
    }
    return achados;
  }

  it('nenhuma ferramenta manda slug fora do enum', () => {
    const validos = slugsDoSchema();
    const foraDaLista = slugsEnviados().filter((e) => !validos.includes(e.slug));
    expect(
      foraDaLista,
      foraDaLista.map((e) => `${e.arquivo} manda formulario: '${e.slug}', que não existe no enum`).join('\n'),
    ).toHaveLength(0);
  });

  it('o CheckoutNI escolhe o slug em tempo de envio', () => {
    // Ele manda por ternário (`virouPedido ? … : …`), então não cai na varredura
    // de literal acima — precisa de checagem própria, senão o par pedido/
    // orçamento poderia sumir sem nenhum teste reclamar.
    const fonte = readFileSync(
      resolve(process.cwd(), 'src/components/tools/CheckoutNI.tsx'),
      'utf-8',
    );
    expect(fonte).toContain("'checkout-ni-pedido'");
    expect(fonte).toContain("'checkout-ni-orcamento'");
  });

  it('a varredura está mesmo achando os envios (âncora anti-falso-verde)', () => {
    // Sem isto, um refactor que mude a forma do literal faria o teste acima
    // passar olhando lista vazia.
    const enviados = slugsEnviados().map((e) => e.slug);
    expect(enviados).toContain('contato');
    expect(enviados).toContain('representante');
    expect(enviados).toContain('custo-de-parada');
  });
});
