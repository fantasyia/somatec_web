import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
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
    expect(regras).toHaveLength(2);
    expect(regras[0].userAgent).toBe('*');
    expect(regras[0].disallow).toBe('/');
    // Única exceção: o robô da Meta lê SÓ privacidade e termos (validação do
    // app Somatec Ads). Nenhum robô de IA nem do Google ganha grupo próprio.
    expect(regras[1].userAgent).toBe('facebookexternalhit');
    expect(regras[1].allow).toEqual(['/politica-de-privacidade', '/termos-de-uso']);
    expect(regras[1].disallow).toBe('/');
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
      // Os mapas internos saíram desta lista em 15/09 — não porque deixaram de
      // importar, mas porque saíram de `public/`. Ver o describe abaixo.
      for (const rota of ['/api', '/login', '/openapi.json']) {
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

// =============================================================================
// MAPAS INTERNOS FORA DE `public/` — decisão do Léo, 15/09/2026.
//
// `cluster-mapa.html` e `mapa-visual-fluxos.html` são o plano editorial inteiro
// (31 silos, 300+ artigos, estrutura de links). Eram servidos em `public/` e
// barrados por `Disallow` no robots.txt — o que NÃO resolvia:
//
//   · `Disallow` e `noindex` se cancelam. Barrado, o Google nunca busca a
//     página e portanto nunca lê o `X-Robots-Tag: noindex` dela; se alguém
//     linkasse o arquivo, ele podia entrar no índice só pela URL.
//   · robots.txt é PÚBLICO. `Disallow: /cluster-mapa.html` publica o endereço
//     exato pra quem abrir o arquivo — e é o primeiro que se abre num site.
//     Medido em 15/09: os dois respondiam 200 a quem tivesse o endereço.
//
// Bloquear É anunciar, então os três objetivos (noindex valer · robô de IA
// fora · não anunciar) não cabiam no robots.txt ao mesmo tempo. Tirar de
// `public/` atende os três de uma vez: não há o que indexar, ingerir nem
// anunciar. O Léo abre os mapas pelo arquivo local — eles são HTML autocontido
// (zero fetch, zero script externo), então `file://` basta, e atualizar o mapa
// deixou de exigir push e deploy.
// =============================================================================

describe('mapas internos fora de public/', () => {
  const MAPAS = ['cluster-mapa.html', 'mapa-visual-fluxos.html'];

  it('nenhum mapa voltou pra public/ (seria servido de novo, sem nada acusar)', () => {
    for (const nome of MAPAS) {
      expect(
        existsSync(resolve(process.cwd(), 'public', nome)),
        `public/${nome} voltou a existir — o site passa a servir o plano editorial em ${nome}`,
      ).toBe(false);
    }
  });

  it('e continuam existindo em docs/mapas/ (âncora anti-falso-verde)', () => {
    // Sem esta, apagar os dois arquivos deixaria o teste acima verde — e o
    // `silos-publico.test.ts`, que lê o mapa do disco, é que iria quebrar.
    for (const nome of MAPAS) {
      expect(
        existsSync(resolve(process.cwd(), 'docs/mapas', nome)),
        `docs/mapas/${nome} sumiu — é a fonte que o teste de silos lê`,
      ).toBe(true);
    }
  });

  it('o robots não os nomeia — a entrada seria o anúncio do endereço', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/app/robots.ts'), 'utf-8');
    const lista = fonte.slice(
      fonte.indexOf('const FORA_DO_INDICE'),
      fonte.indexOf('];', fonte.indexOf('const FORA_DO_INDICE')),
    );
    for (const nome of MAPAS) {
      expect(lista, `${nome} voltou pro FORA_DO_INDICE — isso publica o caminho`).not.toContain(
        nome,
      );
    }
  });
});

describe('heros das LPs — arquivo referenciado tem de existir', () => {
  // As LPs servem imagem por <picture>, e imagem ausente NÃO quebra build nem
  // teste: o navegador só mostra o alt. Os assets `ni-landing-*` chegaram a
  // ficar semanas órfãos no repo antes de serem ligados — quem varrer imagem
  // não usada pode podar justamente estes.
  const LPS = [
    'src/app/protecao-comercial/page.tsx',
    'src/app/protecao-residencial/page.tsx',
  ];

  it('todo /home/hero/*.webp citado nas LPs existe em public/', () => {
    const faltando: string[] = [];
    for (const lp of LPS) {
      const fonte = readFileSync(resolve(process.cwd(), lp), 'utf-8');
      for (const m of fonte.matchAll(/["'](\/home\/hero\/[^"']+\.webp)["']/g)) {
        const rel = `public${m[1]}`;
        if (!existsSync(resolve(process.cwd(), rel))) faltando.push(`${lp} → ${rel}`);
      }
    }
    expect(faltando, faltando.join('\n')).toHaveLength(0);
  });

  it('cada LP cita as DUAS variantes — sem a tall o mobile baixa a wide', () => {
    for (const lp of LPS) {
      const fonte = readFileSync(resolve(process.cwd(), lp), 'utf-8');
      expect(fonte, `${lp} sem variante wide`).toMatch(/\/home\/hero\/[^"']*-wide\.webp/);
      expect(fonte, `${lp} sem variante tall`).toMatch(/\/home\/hero\/[^"']*-tall\.webp/);
    }
  });

  it('as LPs não voltam a usar a foto da home', () => {
    for (const lp of LPS) {
      const fonte = readFileSync(resolve(process.cwd(), lp), 'utf-8');
      const hero = fonte.slice(0, fonte.indexOf('</section>'));
      expect(hero, `${lp} voltou a reusar hero da home`).not.toMatch(
        /src="\/home\/hero-s[0-9]/,
      );
    }
  });
});

describe('og default — a home tem de HERDAR o layout, não cravar o seu', () => {
  const home = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf-8');
  const semComentarios = home
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // Em Next, `openGraph` de página SUBSTITUI o do layout — não há deep-merge.
  // A home cravava o seu até 07/09, então vencia o banco: a copy nova gravava,
  // a revalidação respondia ok, e o card de prévia continuava com o texto
  // velho. Nada acusava erro. Se voltar a cravar, isto quebra.
  it('a home não declara openGraph próprio', () => {
    expect(semComentarios).not.toMatch(/openGraph\s*:/);
  });

  it('a home não declara twitter próprio', () => {
    expect(semComentarios).not.toMatch(/twitter\s*:/);
  });

  it('a home não repete o nome da empresa colado na descrição', () => {
    expect(semComentarios).not.toMatch(/SITE\.fullName\}\s*—\s*\$\{SITE\.description/);
  });

  it('o layout continua lendo o og do banco', () => {
    const layout = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf-8');
    expect(layout).toMatch(/seo\.og_title/);
    expect(layout).toMatch(/seo\.og_description/);
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
    for (const rota of ['/login', '/openapi.json']) {
      expect(semComentarios).not.toContain(`'${rota}'`);
    }
  });

  it('usa a fonte única de contato, sem reescrever e-mail nem telefone', () => {
    expect(semComentarios).toMatch(/CONTACT\.email/);
    expect(semComentarios).not.toMatch(/comercial@somatecblocking\.com\.br/);
  });
});
