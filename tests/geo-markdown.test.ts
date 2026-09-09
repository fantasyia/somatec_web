import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { htmlParaMarkdown } from '@/lib/blog/markdown';

// =============================================================================
// SUPERFÍCIES DE TEXTO PURO PRO LEITOR DE IA.
//
// `/blog/<slug>/markdown` e `/llms-full.txt` existem porque a página HTML
// carrega layout, menu, rodapé, JSON-LD e o runtime do Next em volta de alguns
// parágrafos — um modelo que lê isso gasta a maior parte do contexto em
// marcação.
//
// 🔒 O RISCO REAL destas rotas não é formatação, é VAZAMENTO: elas entregam o
// corpo do artigo em texto. Se um dia passarem a servir rascunho, o conteúdo
// não publicado sai por uma porta que ninguém olha — sem aparecer no /blog, no
// sitemap nem no llms.txt. Por isso o primeiro bloco de testes é esse.
// =============================================================================

const ler = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
const ROTA_MD = 'src/app/blog/[slug]/markdown/route.ts';
const ROTA_FULL = 'src/app/llms-full.txt/route.ts';

describe('🔒 só sai o que já é público', () => {
  it('a rota do artigo lê da MESMA fonte que a página (lerPosts filtra published)', () => {
    const fonte = ler(ROTA_MD);
    expect(fonte).toContain('lerPosts');
    // ⛔ Não pode ler o acervo cru por baixo do filtro.
    expect(fonte).not.toMatch(/lerAcervo|supabase|from\(['"]posts/);
  });

  it('rascunho e placeholder respondem 404, não texto', () => {
    const fonte = ler(ROTA_MD);
    expect(fonte).toMatch(/!post \|\| post\.placeholder/);
    expect(fonte).toMatch(/status:\s*404/);
  });

  it('artigo sem corpo dá 404 — cabeçalho sozinho é casca, e a IA cita casca', () => {
    // Acontece com artigo do acervo em ARQUIVO: o texto mora em
    // blog-content.ts, não no HTML do CMS, e lerHtmlBruto volta vazio.
    expect(ler(ROTA_MD)).toMatch(/if \(!corpo\)[\s\S]{0,160}status:\s*404/);
  });

  it('o llms-full também filtra placeholder e usa lerPosts', () => {
    const fonte = ler(ROTA_FULL);
    expect(fonte).toContain('lerPosts');
    expect(fonte).toMatch(/!p\.placeholder/);
    expect(fonte).not.toMatch(/lerAcervo|supabase/);
  });

  it('acervo vazio devolve arquivo, não 404 — 404 sugere que a convenção não existe', () => {
    // Rastreador que toma 404 pode não voltar. Melhor dizer "em preparação".
    expect(ler(ROTA_FULL)).toMatch(/em prepara[çc][ãa]o/i);
  });

  it('o llms-full tem teto de artigos — acervo grande não vira resposta gigante', () => {
    expect(ler(ROTA_FULL)).toMatch(/MAX_ARTIGOS\s*=\s*\d+/);
  });
});

describe('descoberta: o leitor de IA precisa achar as rotas', () => {
  it('o /llms.txt aponta o texto puro de cada artigo e o acervo completo', () => {
    const fonte = ler('src/app/llms.txt/route.ts');
    expect(fonte).toContain('/markdown');
    expect(fonte).toContain('llms-full.txt');
  });

  it('a página do artigo declara o alternate em text/markdown', () => {
    const fonte = ler('src/app/blog/[slug]/page.tsx');
    expect(fonte).toMatch(/types:\s*\{\s*'text\/markdown'/);
  });
});

describe('hierarquia e formatação do índice', () => {
  it('no llms-full os títulos do artigo descem um nível', () => {
    // O título do artigo é `##`. Sem rebaixar, um <h2> do texto viraria irmão
    // dele e a estrutura se perderia pra quem lê hierarquia.
    expect(ler(ROTA_FULL)).toMatch(/replace\(\/\^\(#\{1,5\}\) \/gm, '#\$1 '\)/);
  });

  it('artigo sem resumo não deixa separador órfão no llms.txt', () => {
    expect(ler('src/app/llms.txt/route.ts')).toMatch(/p\.excerpt \? `\$\{p\.excerpt\} · ` : ''/);
  });
});

describe('conversão de HTML — o texto nunca some', () => {
  it('títulos viram #', () => {
    expect(htmlParaMarkdown('<h2>O que é VTCD</h2>')).toBe('## O que é VTCD');
  });

  it('parágrafos ficam separados', () => {
    const md = htmlParaMarkdown('<p>Primeiro.</p><p>Segundo.</p>');
    expect(md).toBe('Primeiro.\n\nSegundo.');
  });

  it('lista vira marcador', () => {
    expect(htmlParaMarkdown('<ul><li>Um</li><li>Dois</li></ul>')).toBe('- Um\n- Dois');
  });

  it('link leva texto E destino — o destino é metade do valor pra quem indexa', () => {
    expect(htmlParaMarkdown('<p>Veja <a href="/produtos">os modelos</a>.</p>')).toContain(
      '[os modelos](/produtos)',
    );
  });

  it('negrito e itálico sobrevivem', () => {
    expect(htmlParaMarkdown('<p><strong>100 kHz</strong> e <em>VTCD</em></p>')).toBe(
      '**100 kHz** e _VTCD_',
    );
  });

  it('imagem vira o alt — é o que descreve a figura em texto', () => {
    expect(htmlParaMarkdown('<img src="/a.webp" alt="Quadro de entrada">')).toContain(
      '![Quadro de entrada]()',
    );
  });

  it('tabela mantém o dado, mesmo perdendo o desenho', () => {
    const md = htmlParaMarkdown('<table><tr><td>MB-03</td><td>48 kA</td></tr></table>');
    expect(md).toContain('| MB-03 | 48 kA |');
  });

  it('script e style saem inteiros — não é conteúdo de leitura', () => {
    const md = htmlParaMarkdown('<p>Texto</p><script>alert(1)</script><style>p{color:red}</style>');
    expect(md).toBe('Texto');
    expect(md).not.toContain('alert');
  });

  it('acento em entidade é decodificado', () => {
    expect(htmlParaMarkdown('<p>prote&ccedil;&atilde;o el&eacute;trica</p>')).toBe(
      'proteção elétrica',
    );
  });

  it('⚠️ tag desconhecida perde a marcação mas MANTÉM o texto', () => {
    // O pior resultado aceitável é um parágrafo sem formatação. Conteúdo
    // sumido, nunca.
    expect(htmlParaMarkdown('<section><mark>importante</mark></section>')).toBe('importante');
  });

  it('não sobra tag nem sequência de linhas em branco', () => {
    const md = htmlParaMarkdown('<div><p>A</p>\n\n\n<p>B</p></div>');
    expect(md).not.toMatch(/<[^>]+>/);
    expect(md).not.toMatch(/\n{3,}/);
  });
});
