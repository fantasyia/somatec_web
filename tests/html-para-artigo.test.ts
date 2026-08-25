import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { htmlParaArtigo, diagnosticar, ancora, extrairJsonLd } from '@/lib/blog/html-para-artigo';

// =============================================================================
// O tradutor HTML do CMS → ArticleContent.
//
// Os fixtures NÃO são inventados: são o `content_html` real dos 3 artigos que
// estão no banco do CMS hoje. Teste de tradutor contra HTML fabricado prova
// que o fabricante entendeu o próprio formato — não que o formato real cabe.
// =============================================================================

const ARTIGOS: Record<string, string> = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures-artigos-cms.json'), 'utf-8')
);

const SLUGS = Object.keys(ARTIGOS);

describe('tradutor — contra o HTML real do CMS', () => {
  it('os fixtures são artigos de verdade (âncora anti-falso-verde)', () => {
    expect(SLUGS.length).toBe(3);
    for (const slug of SLUGS) {
      expect(ARTIGOS[slug].length, `${slug} veio vazio`).toBeGreaterThan(10_000);
    }
  });

  it.each(SLUGS)('%s vira estrutura utilizável', (slug) => {
    const d = diagnosticar(ARTIGOS[slug]);
    expect(d.problemas, d.problemas.join(' | ')).toHaveLength(0);
    expect(d.secoes).toBeGreaterThanOrEqual(5);
    expect(d.temRespostaRapida).toBe(true);
  });

  it('a resposta rápida sai do blockquote de abertura, sem o rótulo', () => {
    const a = htmlParaArtigo(ARTIGOS['vtcd-o-que-e']);
    expect(a.respostaRapida).toMatch(/VTCD/);
    expect(a.respostaRapida).not.toMatch(/^resposta r[áa]pida/i);
    expect(a.respostaRapida).not.toMatch(/<[a-z]/i); // nada de tag vazando
  });

  it('o FAQ sai da seção de perguntas e não vira seção do índice', () => {
    const a = htmlParaArtigo(ARTIGOS['vtcd-o-que-e']);
    expect(a.faq.length).toBeGreaterThanOrEqual(3);
    for (const f of a.faq) {
      expect(f.pergunta.length).toBeGreaterThan(5);
      expect(f.resposta.length).toBeGreaterThan(20);
    }
    // a seção de FAQ tem template próprio — não pode aparecer duas vezes
    expect(a.secoes.some((s) => /perguntas frequentes/i.test(s.titulo))).toBe(false);
  });

  it('toda seção tem id único e não-vazio (o índice depende disso)', () => {
    for (const slug of SLUGS) {
      const ids = htmlParaArtigo(ARTIGOS[slug]).secoes.map((s) => s.id);
      expect(ids.every(Boolean), `${slug} tem id vazio`).toBe(true);
      expect(new Set(ids).size, `${slug} tem id repetido`).toBe(ids.length);
    }
  });

  it('as tabelas não viram parágrafo solto', () => {
    // o THDv tem tabelas; o texto delas não pode virar linha de parágrafo
    const a = htmlParaArtigo(ARTIGOS['o-que-e-thdv']);
    const tudo = a.secoes.flatMap((s) => s.paragrafos).join(' ');
    expect(tudo).not.toMatch(/Ordem\s+Frequência\s+Origem/);
  });

  it('nenhum parágrafo carrega tag HTML', () => {
    for (const slug of SLUGS) {
      for (const s of htmlParaArtigo(ARTIGOS[slug]).secoes) {
        for (const p of s.paragrafos) expect(p, `${slug}/${s.id}`).not.toMatch(/<[a-z/]/i);
      }
    }
  });
});

describe('tradutor — casos que quebram', () => {
  it('artigo sem H2 é reprovado, não passa em silêncio', () => {
    const d = diagnosticar('<p>Um texto corrido, sem nenhum título.</p>');
    expect(d.ok).toBe(false);
    expect(d.problemas.join(' ')).toMatch(/H2/);
    expect(d.secoes).toBe(0);
  });

  it('seção só com título é apontada', () => {
    const d = diagnosticar('<blockquote><p>Resumo.</p></blockquote><h2>Vazia</h2><h2>Cheia</h2><p>Texto.</p>');
    expect(d.ok).toBe(false);
    expect(d.problemas.join(' ')).toMatch(/Vazia/);
  });

  it('dois H2 com o mesmo texto não colidem no índice', () => {
    const a = htmlParaArtigo('<h2>Como medir</h2><p>a</p><h2>Como medir</h2><p>b</p>');
    expect(a.secoes.map((s) => s.id)).toEqual(['como-medir', 'como-medir-2']);
  });

  it('citação no MEIO do texto não é confundida com resposta rápida', () => {
    const a = htmlParaArtigo('<h2>Início</h2><p>Texto.</p><blockquote><p>Um aparte.</p></blockquote>');
    expect(a.respostaRapida).not.toMatch(/aparte/);
  });

  it('figure com legenda vira imagem da seção', () => {
    const a = htmlParaArtigo(
      '<h2>Com foto</h2><p>Texto.</p><figure><img src="/x.webp" alt="Quadro elétrico"><figcaption>Painel da planta.</figcaption></figure>'
    );
    expect(a.secoes[0].imagem).toEqual({ url: '/x.webp', alt: 'Quadro elétrico', legenda: 'Painel da planta.' });
  });

  it('HTML vazio não explode', () => {
    const a = htmlParaArtigo('');
    expect(a.secoes).toEqual([]);
    expect(a.faq).toEqual([]);
  });

  it('a âncora é estável e sem acento', () => {
    expect(ancora('Por que a VTCD acontece?')).toBe('por-que-a-vtcd-acontece');
    expect(ancora('Distorção harmônica')).toBe('distorcao-harmonica');
    expect(ancora('   ')).toBe('secao');
  });
});

describe('JSON-LD embutido no corpo', () => {
  it('sai do texto visível — senão vira parágrafo de schema na página', () => {
    for (const slug of SLUGS) {
      const tudo = htmlParaArtigo(ARTIGOS[slug]).secoes.flatMap((s) => s.paragrafos).join(' ');
      expect(tudo, slug).not.toMatch(/@context|schema\.org|application\/ld\+json/);
    }
  });

  it('mas não é perdido: volta parseado, pro <head>', () => {
    const schemas = extrairJsonLd(ARTIGOS['vtcd-o-que-e']) as any[];
    expect(schemas.length).toBeGreaterThan(0);
    const grafo = schemas[0]['@graph'] ?? schemas;
    const tipos = (Array.isArray(grafo) ? grafo : [grafo]).map((n: any) => n['@type']);
    expect(tipos).toContain('Article');
    expect(tipos).toContain('FAQPage');
  });

  it('schema quebrado não derruba a página', () => {
    expect(extrairJsonLd('<script type="application/ld+json">{ isso não é json }</script>')).toEqual([]);
  });
});
