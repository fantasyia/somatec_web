import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// =============================================================================
// `loading.tsx` acima de uma rota que chama `notFound()` = soft 404.
//
// `loading.tsx` vira um <Suspense> em volta da rota. O Next manda o shell do
// HTML imediatamente, com status 200, e faz o stream do resto depois — então
// quando o `notFound()` estoura, os headers já foram embora. O corpo sai
// certinho ("Página não encontrada") com HTTP 200. O Google trata soft 404 como
// página de baixa qualidade e segura URL morta no índice.
//
// Era exatamente isso que um `src/app/loading.tsx` (skeleton global) causava em
// /blog/[slug] e /solucoes/[slug] até 25/08.
//
// Rota com `dynamicParams = false` fica de fora: ali o Next decide o 404 no
// roteamento, ANTES de renderizar qualquer coisa, então nenhum <Suspense> acima
// dela chega a atrapalhar. É o caso de /industrias/[setor].
//
// tests/e2e/soft-404.test.ts pega o sintoma de verdade, batendo HTTP num
// servidor de produção — mas só roda depois do build. Este aqui roda no
// `npm test` de sempre e aponta o arquivo culpado direto.
// =============================================================================

const APP = path.join(process.cwd(), 'src', 'app');

type Rota = { pagina: string; culpados: string[] };

function varrer(dir: string, ancestrais: string[]): Rota[] {
  const loadingAqui = path.join(dir, 'loading.tsx');
  const proximosAncestrais = existe(loadingAqui) ? [...ancestrais, loadingAqui] : ancestrais;

  const achados: Rota[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const alvo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      achados.push(...varrer(alvo, proximosAncestrais));
    } else if (entrada.name === 'page.tsx') {
      const fonte = readFileSync(alvo, 'utf8');
      const decideNoRoteamento = /export const dynamicParams\s*=\s*false/.test(fonte);
      if (fonte.includes('notFound()') && !decideNoRoteamento) {
        achados.push({ pagina: rel(alvo), culpados: proximosAncestrais.map(rel) });
      }
    }
  }
  return achados;
}

function rel(p: string): string {
  return path.relative(process.cwd(), p).split(path.sep).join('/');
}

function existe(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

describe('fronteira de Suspense x 404', () => {
  it('nenhuma rota que chama notFound() tem loading.tsx acima dela', () => {
    const rotas = varrer(APP, []);

    // Se isto zerar, a varredura quebrou (mudou o nome do arquivo? o caminho?)
    // e o teste estaria passando à toa.
    expect(rotas.length, 'nenhuma page.tsx com notFound() encontrada').toBeGreaterThan(0);

    const problemas = rotas
      .filter((r) => r.culpados.length > 0)
      .map((r) => `${r.pagina} está dentro de ${r.culpados.join(', ')}`);

    expect(problemas, problemas.join('\n')).toEqual([]);
  });
});
