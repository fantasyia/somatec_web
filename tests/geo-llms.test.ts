import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import robots from '@/app/robots';

// =============================================================================
// GEO — preparo do site para buscador de IA.
//
// Duas coisas são protegidas aqui, e as duas falham em silêncio:
//
// 1. A ARMADILHA DO ROBOTS. Em robots.txt o robô obedece só ao grupo MAIS
//    ESPECÍFICO que casa com o nome dele. Criar um grupo `GPTBot` faz o GPTBot
//    PARAR de herdar o grupo `*` — então, se o grupo novo não repetir os
//    disallow, /api e /login viram rastreáveis pra ele. O arquivo continua
//    válido, ninguém vê erro, e a exposição é real.
//
// 2. STUB ANUNCIADO PRA IA. O blog tem entradas estruturais (placeholder). Se
//    o llms.txt listar essas, a IA pode citar "conteúdo em preparação" como se
//    fosse resposta da Somatec. Pior que não aparecer.
// =============================================================================

const ORIGINAL = process.env.SITE_NOINDEX;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.SITE_NOINDEX;
  else process.env.SITE_NOINDEX = ORIGINAL;
});

describe('robots.txt — robôs de IA', () => {
  it('com NOINDEX ligado, ninguém rastreia nada — nem os robôs de IA', () => {
    process.env.SITE_NOINDEX = 'true';
    const r = robots();
    const regras = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(regras).toHaveLength(1);
    expect(regras[0].userAgent).toBe('*');
    expect(regras[0].disallow).toBe('/');
    // Nada de sitemap enquanto está fechado.
    expect(r.sitemap).toBeUndefined();
  });

  it('os robôs de IA da referência de GEO estão listados por nome', () => {
    process.env.SITE_NOINDEX = 'false';
    const r = robots();
    const regras = Array.isArray(r.rules) ? r.rules : [r.rules];
    const agentes = regras.map((x) => x.userAgent);
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      expect(agentes, `${bot} precisa estar explícito`).toContain(bot);
    }
  });

  it('🔴 TODO grupo repete os disallow — senão bot de IA rastreia /api e /login', () => {
    process.env.SITE_NOINDEX = 'false';
    const r = robots();
    const regras = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(regras.length).toBeGreaterThan(1);

    for (const regra of regras) {
      const bloqueado = ([] as string[]).concat(regra.disallow ?? []);
      for (const rota of ['/api', '/login', '/cluster-mapa.html', '/mapa-visual-fluxos.html']) {
        expect(
          bloqueado,
          `o grupo "${regra.userAgent}" não bloqueia ${rota} — ele deixou de herdar o grupo "*"`,
        ).toContain(rota);
      }
    }
  });

  it('o sitemap volta a ser anunciado quando o site abre', () => {
    process.env.SITE_NOINDEX = 'false';
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

describe('llms.txt', () => {
  const fonte = readFileSync(resolve(process.cwd(), 'src/app/llms.txt/route.ts'), 'utf-8');
  const semComentarios = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('não anuncia artigo placeholder pra IA', () => {
    expect(semComentarios).toMatch(/filter\(\s*\(p\)\s*=>\s*!p\.placeholder\s*\)/);
  });

  it('é servido como texto puro', () => {
    expect(semComentarios).toMatch(/'content-type':\s*'text\/plain; charset=utf-8'/);
  });

  it('blog fora do ar não derruba o arquivo inteiro', () => {
    expect(semComentarios).toMatch(/catch\s*\{/);
  });

  it('as páginas que convertem estão no índice', () => {
    for (const rota of [
      '/produtos',
      '/protecao-residencial',
      '/protecao-comercial',
      '/orcamento-industrial',
      '/ferramentas/custo-de-parada',
      '/resultados',
      '/contato',
    ]) {
      expect(semComentarios, `${rota} faltando no llms.txt`).toContain(`'${rota}'`);
    }
  });

  it('não expõe rota que o robots bloqueia', () => {
    for (const rota of ['/login', '/cluster-mapa.html', '/mapa-visual-fluxos.html']) {
      expect(semComentarios).not.toContain(`'${rota}'`);
    }
  });

  it('usa a fonte única de contato, sem reescrever e-mail nem telefone', () => {
    expect(semComentarios).toMatch(/CONTACT\.email/);
    expect(semComentarios).not.toMatch(/comercial@somatecblocking\.com\.br/);
  });
});
