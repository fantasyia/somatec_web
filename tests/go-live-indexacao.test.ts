import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// A trava de indexação tem de ser UMA SÓ.
//
// O site está NOINDEX até o go-live. A intenção é que virar `SITE_NOINDEX` no
// Railway abra tudo de uma vez. Só que blog e página de autor estavam com
// `index: false` CRAVADO no código — virar a variável abriria o site inteiro e
// deixaria o motor de SEO de fora.
//
// É o tipo de falha que não dá erro: o deploy sobe, o site fica indexável, e
// meses depois alguém pergunta por que o blog nunca apareceu no Google.
//
// Estes testes existem pra que o go-live seja mesmo uma variável, e não uma
// caça a arquivo.
// =============================================================================

/** Páginas que são internas POR NATUREZA — ficam fora do índice sempre, e não
 *  têm nada a ver com o go-live. */
const SEMPRE_FORA_DO_INDICE = [
  'src/app/login/page.tsx',
  'src/app/not-found.tsx',
  'src/app/status/page.tsx',
  // O layout raiz é caso à parte, e o teste abaixo cuida dele: o default
  // global não vem do env, vem de `site_settings.robots_index` no banco.
  'src/app/layout.tsx',
];

function paginasDoApp(): string[] {
  const out: string[] = [];
  const anda = (dir: string) => {
    for (const nome of readdirSync(resolve(process.cwd(), dir))) {
      const rel = `${dir}/${nome}`;
      if (statSync(resolve(process.cwd(), rel)).isDirectory()) anda(rel);
      else if (/\.tsx?$/.test(nome)) out.push(rel);
    }
  };
  anda('src/app');
  return out;
}

describe('go-live: uma chave só pra indexação', () => {
  it('a varredura enxerga o app de verdade (âncora anti-falso-verde)', () => {
    const arquivos = paginasDoApp();
    expect(arquivos.length).toBeGreaterThan(20);
    expect(arquivos).toContain('src/app/blog/page.tsx');
    expect(arquivos).toContain('src/app/sitemap.ts');
  });

  it('nenhuma página pública crava index: false', () => {
    const cravadas: string[] = [];
    for (const arquivo of paginasDoApp()) {
      if (SEMPRE_FORA_DO_INDICE.includes(arquivo)) continue;
      const fonte = readFileSync(resolve(process.cwd(), arquivo), 'utf-8');
      if (/robots:\s*\{[^}]*index:\s*false/.test(fonte)) cravadas.push(arquivo);
    }
    expect(
      cravadas,
      `estas páginas ficariam fora do índice mesmo depois do go-live:\n${cravadas.join('\n')}`,
    ).toHaveLength(0);
  });

  it('blog e página de autor seguem a mesma variável do resto do site', () => {
    for (const arquivo of ['src/app/blog/page.tsx', 'src/app/blog/[slug]/page.tsx', 'src/app/autor/[slug]/page.tsx']) {
      const fonte = readFileSync(resolve(process.cwd(), arquivo), 'utf-8');
      expect(fonte, arquivo).toMatch(/index:\s*process\.env\.SITE_NOINDEX\s*!==\s*'true'/);
    }
  });

  it('⚠️ o default global vem do BANCO, não do env — são DUAS chaves', () => {
    // Descoberto pelo teste acima, e não é bug: o layout raiz usa
    // `site_settings.robots_index`, que default pra false. Páginas com robots
    // próprio (a maioria) sobrescrevem via SITE_NOINDEX; as que não têm caem
    // aqui.
    //
    // Consequência prática: virar SITE_NOINDEX no Railway NÃO basta. Tem de
    // marcar `robots_index = true` em site_settings também — e a tela que
    // fazia isso (/admin/seo) saiu em 25/08, então hoje é no banco.
    //
    // Este teste existe pra que a segunda chave não seja esquecida. Está no
    // checklist de go-live do card "🌐 Site — lançamento (técnico)".
    const fonte = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf-8');
    expect(fonte).toMatch(/robots_index\s*\?\?\s*false/);
  });

  it('o robots.txt inteiro também depende da mesma variável', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/app/robots.ts'), 'utf-8');
    expect(fonte).toMatch(/process\.env\.SITE_NOINDEX === 'true'/);
    expect(fonte).toMatch(/disallow:\s*'\/'/);
  });
});

describe('go-live: o sitemap conhece o blog', () => {
  const sitemap = () => readFileSync(resolve(process.cwd(), 'src/app/sitemap.ts'), 'utf-8');

  it('o índice do blog está na lista estática', () => {
    expect(sitemap()).toContain('${base}/blog`');
  });

  it('os artigos saem da mesma fonte que renderiza o blog', () => {
    // Se alguém trocar por uma lista fixa, artigo publicado no CMS não entra
    // no sitemap e ninguém percebe.
    const fonte = sitemap();
    expect(fonte).toMatch(/lerPosts/);
    expect(fonte).toMatch(/\/blog\/\$\{post\.slug\}/);
  });

  it('as páginas de autor entram junto', () => {
    expect(sitemap()).toMatch(/autoresComPagina/);
    expect(sitemap()).toMatch(/\/autor\/\$\{a\.slug\}/);
  });

  it('sitemap não pode quebrar se o banco cair', () => {
    // Sitemap sem o blog é ruim; sitemap com erro 500 é pior — o Google
    // desiste do arquivo inteiro.
    expect(sitemap()).toMatch(/try\s*\{[\s\S]*lerPosts[\s\S]*\}\s*catch/);
  });
});
