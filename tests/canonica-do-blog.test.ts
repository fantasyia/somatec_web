import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// CONTRATO DE URL DO BLOG — uma URL por artigo: /blog/<slug>
//
// O CMS gravava a canônica como `/<silo>/<slug>` — herança de quando ele
// servia as próprias páginas públicas. Essas páginas saíram em 25/08; o site é
// o `somatec_web`, e aqui o post vive em `/blog/<slug>`. O valor gravado
// apontava pra uma rota que não existe em lugar nenhum.
//
// Canônica pra 404 é dos piores sinais que se manda pro Google: ele pode
// descartar a URL boa e simplesmente não indexar o artigo.
//
// O silo continua existindo como TAXONOMIA — organiza o conteúdo, monta o hub
// no admin, alimenta o interlink. Só não entra no caminho da URL.
// =============================================================================

const CMS = 'C:/Users/TechD/.claude/github/somatec-cms';

function fonteDoCms(rel: string): string | null {
  const caminho = `${CMS}/${rel}`;
  // O CMS é outro repo e pode não estar clonado (CI, outra máquina).
  return existsSync(caminho) ? readFileSync(caminho, 'utf-8') : null;
}

describe('site — a canônica do artigo', () => {
  it('é declarada como /blog/<slug>', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/app/blog/[slug]/page.tsx'), 'utf-8');
    expect(fonte).toMatch(/canonical:\s*`\/blog\/\$\{post\.slug\}`/);
  });

  it('o site NÃO tem rota /[silo]/[slug] — a canônica antiga apontava pra cá', () => {
    const raiz = resolve(process.cwd(), 'src/app');
    const dinamicas = readdirSync(raiz, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('['))
      .map((d) => d.name);
    // Uma pasta dinâmica na RAIZ do app capturaria qualquer /<algo>, incluindo
    // /vtcd — e aí a URL velha voltaria a responder 200 com conteúdo duplicado.
    expect(dinamicas, `rota dinâmica na raiz: ${dinamicas.join(', ')}`).toHaveLength(0);
  });

  it('o sitemap só publica artigo em /blog/', () => {
    const sitemap = readFileSync(resolve(process.cwd(), 'src/app/sitemap.ts'), 'utf-8');
    expect(sitemap).toMatch(/\/blog\/\$\{post\.slug\}/);
    // nenhuma montagem de caminho por silo
    expect(sitemap).not.toMatch(/\$\{[^}]*silo[^}]*\}\/\$\{/i);
  });
});

describe('CMS — o gerador da canônica (outro repo)', () => {
  const canonical = fonteDoCms('lib/seo/canonical.ts');

  it.runIf(canonical)('buildPostCanonicalPath devolve /blog/<slug>', () => {
    expect(canonical).toMatch(/return `\/blog\/\$\{slug\}`/);
    // O que NÃO pode voltar: o silo compondo o caminho do post.
    expect(canonical).not.toMatch(/return `\/\$\{silo\}\/\$\{slug\}`/);
  });

  it.runIf(canonical)('o hub de silo não afirma canônica que não existe', () => {
    // Enquanto o site não tiver página de hub, `null` é a resposta honesta:
    // melhor nenhuma canônica que uma apontando pra 404.
    expect(canonical).toMatch(/buildSiloCanonicalPath[\s\S]{0,400}?return null;/);
  });

  it.runIf(canonical)('o motivo está escrito no arquivo, não só aqui', () => {
    // Sem o porquê ao lado do código, alguém "conserta" de volta em seis meses.
    expect(canonical).toMatch(/CONTRATO DE URL/);
  });
});
