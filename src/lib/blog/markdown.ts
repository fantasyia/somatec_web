import 'server-only';

// =============================================================================
// HTML DO ARTIGO → MARKDOWN, pro leitor de IA.
//
// Por que existe: ChatGPT, Perplexity e afins leem melhor texto limpo do que
// HTML de aplicação — no nosso caso, a página do artigo carrega layout, menu,
// rodapé, JSON-LD e script do Next em volta de alguns parágrafos. É o mesmo
// motivo pelo qual a Cloudflare serve "View as Markdown" na documentação dela.
//
// ⚠️ NÃO é um conversor de HTML genérico, e não deve virar um. Ele converte o
// subconjunto que o CMS realmente produz no corpo do artigo. Tag que não está
// aqui perde a marcação mas MANTÉM o texto — o pior resultado possível é um
// parágrafo sem negrito, nunca conteúdo sumido.
//
// 🔒 Serve conteúdo já público: quem decide o que é público é o
// `published` do CMS, lido em `lerPosts`. Este módulo não consulta banco.
// =============================================================================

/** Entidades que aparecem de fato no conteúdo em pt-BR. */
function decodificar(txt: string): string {
  const mapa: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú',
    '&atilde;': 'ã',
    '&otilde;': 'õ',
    '&ccedil;': 'ç',
    '&acirc;': 'â',
    '&ecirc;': 'ê',
    '&ocirc;': 'ô',
  };
  return txt
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;|&#39;/gi, (e) => mapa[e.toLowerCase()] ?? mapa[e] ?? e);
}

/** Tira as tags que sobraram e normaliza o espaço em branco de uma linha. */
function limpar(txt: string): string {
  return decodificar(txt.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/**
 * Converte o corpo do artigo em markdown.
 *
 * A ordem importa: os blocos que CONTÊM outros (lista, citação, tabela) são
 * tratados antes de a varredura de tags soltas rodar, senão o `<li>` viraria
 * texto solto e a lista sumiria como lista.
 */
export function htmlParaMarkdown(html: string): string {
  let t = html;

  // Fora: o que não é conteúdo de leitura.
  t = t.replace(/<script[\s\S]*?<\/script>/gi, '');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, '');
  t = t.replace(/<!--[\s\S]*?-->/g, '');

  // Imagem vira o alt — é o que descreve a figura pra quem lê em texto.
  t = t.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, (_, alt) =>
    alt ? `\n![${limpar(alt)}]()\n` : '\n',
  );
  t = t.replace(/<img[^>]*>/gi, '\n');

  // Link: o texto e o destino, que é metade do valor pra quem indexa.
  t = t.replace(
    /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, texto) => `[${limpar(texto)}](${href})`,
  );

  // Blocos que contêm outros — antes da varredura geral.
  t = t.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${limpar(item)}`);
  t = t.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
  t = t.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_, dentro) => `\n> ${limpar(dentro)}\n`,
  );

  // Tabela: cada linha vira uma linha de markdown. Sem alinhamento nem
  // cabeçalho separado — o valor aqui é o DADO, não o desenho.
  t = t.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, linha: string) => {
    const celulas = [...linha.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) =>
      limpar(m[1]),
    );
    return celulas.length ? `\n| ${celulas.join(' | ')} |` : '\n';
  });
  t = t.replace(/<\/?(table|thead|tbody)[^>]*>/gi, '\n');

  // Títulos.
  for (const n of [1, 2, 3, 4, 5, 6]) {
    t = t.replace(
      new RegExp(`<h${n}[^>]*>([\\s\\S]*?)</h${n}>`, 'gi'),
      (_, txt) => `\n\n${'#'.repeat(n)} ${limpar(txt)}\n`,
    );
  }

  // Ênfase e código.
  t = t.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, txt) => `**${limpar(txt)}**`);
  t = t.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, txt) => `_${limpar(txt)}_`);
  t = t.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, txt) => `\`${limpar(txt)}\``);

  // Parágrafo e quebra.
  t = t.replace(/<\/p>/gi, '\n\n');
  t = t.replace(/<br\s*\/?>/gi, '\n');

  // O que sobrou de tag: fora, mantendo o texto.
  t = t.replace(/<[^>]+>/g, '');
  t = decodificar(t);

  return t
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
