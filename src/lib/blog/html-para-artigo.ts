// =============================================================================
// TRADUTOR — HTML do CMS → ArticleContent (a estrutura que o template usa).
//
// O CMS guarda o artigo como um bloco de HTML. O template do site precisa da
// ficha etiquetada: resposta rápida, seções com id (pro índice lateral),
// subseções, imagem com legenda e FAQ (que vira JSON-LD).
//
// Em vez de mudar o CMS ou empobrecer o template, esta função deriva a
// estrutura do próprio HTML. Foi conferida contra os artigos que já estão no
// banco: o blockquote de abertura é a resposta rápida, cada <h2> abre uma
// seção, os <h3> viram subseções e a seção cujo título fala em "perguntas
// frequentes" vira o FAQ.
//
// ⚠️ Depende da redação usar H2/H3. Artigo escrito num bloco só nasce com
// índice vazio — por isso `diagnosticar()` existe: é o que o teste de
// publicação consulta pra reprovar antes de ir pro ar.
// =============================================================================

import type { ArticleContent, ArticleFaq, ArticleSection } from '@/lib/constants/blog-content';

/** Só o texto, com o espaçamento normalizado. */
function texto(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Âncora do índice. Precisa ser estável: é o que o scrollspy persegue. */
export function ancora(titulo: string): string {
  return texto(titulo)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'secao';
}

/** Parágrafos de um pedaço de HTML — <p> e itens de lista viram linha. */
function paragrafos(html: string): string[] {
  const saida: string[] = [];
  for (const m of html.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = texto(m[2]);
    if (t) saida.push(m[1].toLowerCase() === 'li' ? `• ${t}` : t);
  }
  return saida;
}

function primeiraImagem(html: string) {
  const fig = html.match(/<figure\b[^>]*>([\s\S]*?)<\/figure>/i);
  const alvo = fig ? fig[1] : html;
  const img = alvo.match(/<img\b[^>]*>/i);
  if (!img) return undefined;
  const url = (img[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1];
  if (!url) return undefined;
  const alt = (img[0].match(/\balt\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
  const cap = alvo.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
  return { url, alt, legenda: cap ? texto(cap[1]) : '' };
}

const RE_FAQ = /perguntas frequentes|d[úu]vidas frequentes|\bfaq\b/i;

/** Seção de FAQ: cada <h3> é uma pergunta, o que vem depois é a resposta. */
function faqDaSecao(html: string): ArticleFaq[] {
  const partes = html.split(/(?=<h3\b)/i).filter((p) => /^<h3\b/i.test(p));
  const saida: ArticleFaq[] = [];
  for (const parte of partes) {
    const t = parte.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
    if (!t) continue;
    const pergunta = texto(t[1]);
    const resposta = paragrafos(parte.slice(t[0].length + (t.index ?? 0))).join(' ');
    if (pergunta && resposta) saida.push({ pergunta, resposta });
  }
  return saida;
}

/** O bloco de schema aparece de DUAS formas, e a segunda é a que os artigos
 *  reais têm: o conversor de markdown escapou a tag (&lt;script&gt;) e ainda
 *  embrulhou num <p>. Quem procurar só por "<script" não acha nada — e o
 *  schema inteiro vai parar na tela como parágrafo de texto. */
const RE_SCRIPT_LD = [
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  /&lt;script[\s\S]*?&gt;([\s\S]*?)&lt;\/script&gt;/gi,
];

function desescapar(v: string): string {
  return v
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&');
}

export function extrairJsonLd(html: string): Record<string, unknown>[] {
  const saida: Record<string, unknown>[] = [];
  for (const re of RE_SCRIPT_LD) {
    for (const m of String(html || '').matchAll(re)) {
      try {
        const parseado = JSON.parse(desescapar(m[1]).trim());
        // Só objeto entra: string ou número solto no <script> não é schema,
        // e emitir isso no <head> quebra o parser do Google.
        if (parseado && typeof parseado === 'object' && !Array.isArray(parseado)) {
          saida.push(parseado as Record<string, unknown>);
        }
      } catch {
        // schema quebrado não derruba a página — só não é emitido
      }
    }
  }
  return saida;
}

/** Tira do corpo o que não é texto de leitura. */
function limparCorpo(html: string): string {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // schema escapado: tira o bloco E o <p> que o embrulha, senão sobra
    // parágrafo vazio no meio das referências
    .replace(/(?:<p\b[^>]*>\s*)?&lt;script[\s\S]*?&lt;\/script&gt;(?:\s*<\/p>)?/gi, '');
}

export function htmlParaArtigo(html: string, opcoes?: { atualizadoEm?: string }): ArticleContent {
  const fonte = limparCorpo(html);

  // Resposta rápida: o blockquote que abre o artigo (padrão editorial). Só
  // conta se vier ANTES do primeiro <h2> — citação no meio do texto não é
  // resposta rápida.
  const posH2 = fonte.search(/<h2\b/i);
  const abertura = posH2 >= 0 ? fonte.slice(0, posH2) : fonte;
  const bq = abertura.match(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/i);
  const respostaRapida = bq
    ? texto(bq[1]).replace(/^resposta r[áa]pida:?\s*/i, '')
    : texto(abertura).slice(0, 320);

  const secoes: ArticleSection[] = [];
  let faq: ArticleFaq[] = [];

  const blocos = fonte.split(/(?=<h2\b)/i).filter((b) => /^<h2\b/i.test(b));
  const usados = new Set<string>();

  for (const bloco of blocos) {
    const cab = bloco.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    if (!cab) continue;
    const titulo = texto(cab[1]);
    const corpo = bloco.slice(cab[0].length);

    if (RE_FAQ.test(titulo)) {
      faq = faqDaSecao(corpo);
      continue; // o FAQ tem template próprio, não entra como seção
    }

    // id único: dois H2 com o mesmo texto quebrariam o índice
    let id = ancora(titulo);
    let n = 2;
    while (usados.has(id)) id = `${ancora(titulo)}-${n++}`;
    usados.add(id);

    // Subseções: o que vem depois do primeiro <h3>
    const partesH3 = corpo.split(/(?=<h3\b)/i);
    const antesDoH3 = partesH3[0];
    const subsecoes = partesH3
      .slice(1)
      .map((parte) => {
        const t = parte.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
        if (!t) return null;
        return { titulo: texto(t[1]), paragrafos: paragrafos(parte.slice(t[0].length)) };
      })
      .filter((x): x is { titulo: string; paragrafos: string[] } => Boolean(x && x.titulo));

    secoes.push({
      id,
      titulo,
      paragrafos: paragrafos(antesDoH3),
      ...(primeiraImagem(antesDoH3) ? { imagem: primeiraImagem(antesDoH3)! } : {}),
      ...(subsecoes.length ? { subsecoes } : {}),
    });
  }

  return {
    respostaRapida,
    ...(opcoes?.atualizadoEm ? { atualizadoEm: opcoes.atualizadoEm } : {}),
    secoes,
    faq,
  };
}

export type Diagnostico = {
  ok: boolean;
  problemas: string[];
  secoes: number;
  perguntas: number;
  temRespostaRapida: boolean;
};

/** O que impede um artigo do CMS de virar página decente.
 *  Serve pro teste que roda antes de publicar — o índice nascer vazio é o
 *  tipo de defeito que ninguém percebe até estar no ar. */
export function diagnosticar(html: string): Diagnostico {
  const artigo = htmlParaArtigo(html);
  const problemas: string[] = [];

  if (artigo.secoes.length === 0) {
    problemas.push('Nenhum H2 no corpo — o índice lateral nasceria vazio.');
  }
  if (!artigo.respostaRapida.trim()) {
    problemas.push('Sem resposta rápida — perde o alvo de featured snippet.');
  }
  const vazias = artigo.secoes.filter((s) => s.paragrafos.length === 0 && !s.subsecoes?.length);
  if (vazias.length) {
    problemas.push(`${vazias.length} seção(ões) só com título: ${vazias.map((s) => s.titulo).join(', ')}`);
  }

  return {
    ok: problemas.length === 0,
    problemas,
    secoes: artigo.secoes.length,
    perguntas: artigo.faq.length,
    temRespostaRapida: Boolean(artigo.respostaRapida.trim()),
  };
}
