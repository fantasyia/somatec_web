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
    expect(SLUGS.length).toBe(4);
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

// =============================================================================
// TABELAS.
//
// O tradutor só lia <p> e <li>. Toda <table> do `content_html` era descartada
// na tradução — 28 delas, espalhadas pelos 14 artigos escritos (medido no
// banco em 29/08/2026). Não era erro: a seção renderizava com o texto ao redor
// e a tabela simplesmente não existia na página.
//
// Doía mais que o normal porque tabela comparativa é o miolo do argumento
// desses artigos (classe de DPS, faixa de frequência, limite normativo) e é o
// formato que a busca extrai com mais facilidade.
// =============================================================================

function tabelasDe(artigo: ReturnType<typeof htmlParaArtigo>) {
  return artigo.secoes
    .flatMap((s) => [...(s.blocos ?? []), ...(s.subsecoes ?? []).flatMap((sub) => sub.blocos ?? [])])
    .filter((b) => b.tipo === 'tabela');
}

describe('tabelas — contra o HTML real do CMS', () => {
  it.each(SLUGS)('%s: nenhuma tabela fica pelo caminho', (slug) => {
    // Fora do FAQ, que tem template próprio (só pergunta e resposta).
    const noHtml =
      ARTIGOS[slug]
        .split(/(?=<h2\b)/i)
        .filter((b) => !/<h2\b[^>]*>[^<]*(perguntas frequentes|d[úu]vidas frequentes|faq)/i.test(b))
        .join('')
        .match(/<table\b/gi)?.length ?? 0;

    expect(noHtml, `${slug} não tem tabela — fixture errada`).toBeGreaterThan(0);
    expect(tabelasDe(htmlParaArtigo(ARTIGOS[slug])), slug).toHaveLength(noHtml);
  });

  it('a seção que É só uma tabela chega inteira (era o caso visível)', () => {
    // "O comparativo, lado a lado" é um <h2> seguido direto de <table>: sem
    // parágrafo nenhum. Chegava ao site como título sozinho.
    const sec = htmlParaArtigo(ARTIGOS['master-block-vs-dps-comum']).secoes.find((s) =>
      /comparativo, lado a lado/i.test(s.titulo)
    );
    expect(sec, 'seção do comparativo sumiu').toBeDefined();
    const tab = (sec!.blocos ?? []).find((b) => b.tipo === 'tabela');
    expect(tab, 'a seção voltou a ficar sem a tabela').toBeDefined();
    if (tab?.tipo !== 'tabela') throw new Error('bloco não é tabela');
    expect(tab.tabela.cabecalho).toEqual(['Critério', 'DPS comum (Classe III)', 'Master Block']);
    expect(tab.tabela.linhas.length).toBeGreaterThanOrEqual(8);
    expect(tab.tabela.linhas[0][0]).toBe('Classificação normativa');
  });

  it('a tabela vem DEPOIS do parágrafo que a apresenta', () => {
    // "Os valores de referência mais usados:" e a tabela logo abaixo. Guardar
    // tabela numa lista à parte jogaria todas pro fim da seção.
    const sec = htmlParaArtigo(ARTIGOS['o-que-e-thdv']).secoes.find((s) =>
      /limites normativos/i.test(s.titulo)
    )!;
    const tipos = (sec.blocos ?? []).map((b) => b.tipo);
    expect(tipos[0]).toBe('paragrafo');
    expect(tipos[1]).toBe('tabela');
  });

  it('célula não carrega tag nem entidade HTML', () => {
    for (const slug of SLUGS) {
      for (const b of tabelasDe(htmlParaArtigo(ARTIGOS[slug]))) {
        if (b.tipo !== 'tabela') continue;
        for (const celula of [...b.tabela.cabecalho, ...b.tabela.linhas.flat()]) {
          expect(celula, slug).not.toMatch(/<[a-z/]/i);
          expect(celula, slug).not.toMatch(/&(nbsp|amp|quot|lt|gt);/i);
        }
      }
    }
  });

  it('toda linha tem a largura do cabeçalho', () => {
    for (const slug of SLUGS) {
      for (const b of tabelasDe(htmlParaArtigo(ARTIGOS[slug]))) {
        if (b.tipo !== 'tabela' || !b.tabela.cabecalho.length) continue;
        for (const linha of b.tabela.linhas) {
          expect(linha.length, `${slug}: linha torta`).toBe(b.tabela.cabecalho.length);
        }
      }
    }
  });
});

describe('tabelas — casos que quebram', () => {
  it('linha de <th> vira cabeçalho; <th> misturado com <td> é dado', () => {
    const comCabecalho = htmlParaArtigo(
      '<h2>T</h2><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>'
    ).secoes[0].blocos![0];
    if (comCabecalho.tipo !== 'tabela') throw new Error('esperava tabela');
    expect(comCabecalho.tabela.cabecalho).toEqual(['A', 'B']);
    expect(comCabecalho.tabela.linhas).toEqual([['1', '2']]);

    // <th> como rótulo de linha não é cabeçalho — perderia a primeira linha.
    const semCabecalho = htmlParaArtigo(
      '<h2>T</h2><table><tr><th>Motores</th><td>Aquecem</td></tr></table>'
    ).secoes[0].blocos![0];
    if (semCabecalho.tipo !== 'tabela') throw new Error('esperava tabela');
    expect(semCabecalho.tabela.cabecalho).toEqual([]);
    expect(semCabecalho.tabela.linhas).toEqual([['Motores', 'Aquecem']]);
  });

  it('linha curta é completada — senão a coluna desalinha dali pra baixo', () => {
    const b = htmlParaArtigo(
      '<h2>T</h2><table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td>1</td></tr></table>'
    ).secoes[0].blocos![0];
    if (b.tipo !== 'tabela') throw new Error('esperava tabela');
    expect(b.tabela.linhas[0]).toEqual(['1', '', '']);
  });

  it('<p> dentro de célula não vira parágrafo solto no meio do texto', () => {
    // A varredura casa a tabela INTEIRA primeiro, então o que está dentro dela
    // não escapa como bloco de texto por fora.
    const sec = htmlParaArtigo(
      '<h2>T</h2><p>Antes.</p><table><tr><td><p>Dentro</p></td></tr></table><p>Depois.</p>'
    ).secoes[0];
    expect(sec.paragrafos).toEqual(['Antes.', 'Depois.']);
    expect((sec.blocos ?? []).map((b) => b.tipo)).toEqual(['paragrafo', 'tabela', 'paragrafo']);
  });

  it('tabela vazia não vira moldura oca', () => {
    const sec = htmlParaArtigo('<h2>T</h2><p>x</p><table><tbody></tbody></table>').secoes[0];
    expect((sec.blocos ?? []).map((b) => b.tipo)).toEqual(['paragrafo']);
  });

  it('seção que é SÓ tabela não é mais acusada de estar vazia', () => {
    const d = diagnosticar(
      '<blockquote><p>Resumo.</p></blockquote><h2>Comparativo</h2><table><tr><td>a</td></tr></table>'
    );
    expect(d.problemas.join(' '), d.problemas.join(' ')).not.toMatch(/só com título/);
    expect(d.tabelas).toBe(1);
  });

  it('tabela que NÃO chega à estrutura é apontada — a perda não pode ser calada', () => {
    // Tabela antes do primeiro <h2> não pertence a seção nenhuma: some da
    // página do mesmo jeito. O diagnóstico precisa dizer isso em vez de passar.
    const d = diagnosticar(
      '<blockquote><p>Resumo.</p></blockquote><table><tr><td>x</td></tr></table><h2>S</h2><p>t</p>'
    );
    expect(d.ok).toBe(false);
    expect(d.problemas.join(' ')).toMatch(/tabela/i);
    expect(d.tabelas).toBe(0);
  });
});
