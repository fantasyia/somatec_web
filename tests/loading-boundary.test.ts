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

// =============================================================================
// A7 DA AUDITORIA — loading.tsx joga o conteúdo indexável pra dentro de
// <div hidden>.
//
// O `src/app/produtos/loading.tsx` fazia a /produtos servir skeleton + rodapé
// no HTML, com o <h1>, a tabela de modelos e o JSON-LD `Product` DENTRO de um
// <div hidden id="S:0"> (streaming do Suspense). Googlebot resolve com JS;
// crawler de IA sem JS via a página vazia — logo a página que MAIS importa pra
// "o que é o Master Block". A guarda de cima só pega o par loading+notFound;
// esta pega qualquer loading.tsx envolvendo uma página que emite conteúdo
// primário (H1 ou JSON-LD).
// =============================================================================

function paginasComConteudoIndexavel(dir: string, comLoadingAcima: boolean, out: string[] = []): string[] {
  const loadingAqui = existe(path.join(dir, 'loading.tsx'));
  const cobre = comLoadingAcima || loadingAqui;
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const alvo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      paginasComConteudoIndexavel(alvo, cobre, out);
    } else if (entrada.name === 'page.tsx' && cobre) {
      const fonte = readFileSync(alvo, 'utf8');
      const emiteConteudo = /application\/ld\+json/.test(fonte) || /<h1[\s>]/.test(fonte);
      if (emiteConteudo) out.push(rel(alvo));
    }
  }
  return out;
}

describe('loading.tsx não envolve conteúdo indexável (A7)', () => {
  it('nenhuma page.tsx com H1/JSON-LD está sob um loading.tsx', () => {
    const problemas = paginasComConteudoIndexavel(APP, false);
    expect(
      problemas,
      `estas páginas servem conteúdo dentro de <div hidden> por streaming:\n${problemas.join('\n')}`,
    ).toEqual([]);
  });
});

// =============================================================================
// MESMA FAMÍLIA DE DEFEITO, OUTRO MECANISMO: conteúdo que existe no HTML e
// mesmo assim ninguém vê.
//
// O `Reveal` nasce em `opacity-0` e só sobe pra 1 quando o IntersectionObserver
// dispara. Sem JavaScript esse gatilho não existe — a página carrega com o
// texto todo presente e invisível na tela, para sempre, sem nada acusando. É o
// mesmo estrago que o `loading.tsx` fazia por outro caminho, e o mesmo que o
// CountUp fazia servindo "0%".
// =============================================================================

describe('conteúdo animado continua visível sem JavaScript', () => {
  const reveal = readFileSync(
    path.join(process.cwd(), 'src', 'components', 'ui', 'Reveal.tsx'),
    'utf8',
  );
  const layout = readFileSync(path.join(process.cwd(), 'src', 'app', 'layout.tsx'), 'utf8');

  it('o Reveal marca os elementos que o <noscript> precisa alcançar', () => {
    expect(reveal).toContain('data-reveal');
    // Se o estado inicial deixar de ser opacity-0, o noscript vira enfeite —
    // mas aí o defeito também some. O que não pode é um sem o outro.
    expect(reveal).toContain('opacity-0');
  });

  it('o layout raiz desfaz o estado inicial quando não há JS', () => {
    expect(layout).toContain('<noscript>');
    expect(layout).toMatch(/\[data-reveal\]\{opacity:1!important/);
  });
});
