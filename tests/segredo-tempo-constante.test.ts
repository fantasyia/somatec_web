import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

// =============================================================================
// COMPARAÇÃO DE SEGREDO EM ROTA — E O PADRÃO QUE ESCONDEU DOIS CONSERTOS.
//
// Em 14/09, ao rotacionar o BLOG_REVALIDATE_SECRET, descobri que M7 e metade
// de B4 estavam marcados como feitos no card e NÃO estavam no código. Os dois
// tinham a mesma assinatura: `import { constantTimeEquals }` no topo, nenhuma
// chamada no arquivo, e um `===` comparando o segredo logo abaixo. O lint
// deste projeto não reprova import órfão, então nada acusava.
//
// Esta guarda pega as duas pontas do padrão:
//  · import de `constantTimeEquals` que ninguém chama — sinal de conserto
//    aplicado pela metade;
//  · `=== <algo que é segredo>` dentro de src/app/api.
//
// Por que importa: `===` para de comparar no primeiro byte diferente, então o
// tempo de resposta conta quantos caracteres do segredo já estão certos.
// =============================================================================

const API = resolve(process.cwd(), 'src/app/api');

function rotas(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) rotas(caminho, out);
    else if (nome.endsWith('.ts')) out.push(caminho);
  }
  return out;
}

/** Nomes que, comparados com `===`, são segredo — não dado comum. */
const NOMES_DE_SEGREDO = ['esperado', 'segredo', 'secret', 'token', 'assinatura'];

describe('rotas de API comparam segredo em tempo constante', () => {
  const arquivos = rotas(API);

  it('a varredura acha rotas (não passa por estar vazia)', () => {
    expect(arquivos.length).toBeGreaterThan(10);
  });

  it('nenhum import de constantTimeEquals fica sem uso', () => {
    const orfaos = arquivos.filter((f) => {
      const fonte = readFileSync(f, 'utf8');
      if (!fonte.includes('constantTimeEquals')) return false;
      // Uma ocorrência só = a linha do import.
      return (fonte.match(/constantTimeEquals/g) ?? []).length < 2;
    });
    expect(
      orfaos.map((f) => relative(process.cwd(), f)),
      'import de constantTimeEquals sem chamada — conserto aplicado pela metade',
    ).toEqual([]);
  });

  it('nenhuma rota compara segredo com ===', () => {
    const suspeitas: string[] = [];
    for (const f of arquivos) {
      const fonte = readFileSync(f, 'utf8');
      fonte.split('\n').forEach((linha, i) => {
        if (linha.trim().startsWith('//') || linha.trim().startsWith('*')) return;
        for (const nome of NOMES_DE_SEGREDO) {
          const re = new RegExp(`[!=]==\s*${nome}\b|\b${nome}\s*[!=]==`);
          if (re.test(linha)) suspeitas.push(`${relative(process.cwd(), f)}:${i + 1}`);
        }
      });
    }
    expect(
      [...new Set(suspeitas)],
      `comparação de segredo sem tempo constante: ${suspeitas.join(', ')}`,
    ).toEqual([]);
  });
});
