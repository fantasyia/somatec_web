import { lerPosts, lerHtmlBruto } from '@/lib/blog/fonte';
import { htmlParaMarkdown } from '@/lib/blog/markdown';
import { SITE } from '@/lib/constants/site';

/**
 * `/blog/<slug>/markdown` — o artigo em texto puro, pro leitor de IA.
 *
 * Mesma ideia do "View as Markdown" da documentação da Cloudflare: a página
 * HTML carrega layout, menu, rodapé, JSON-LD e o runtime do Next em volta de
 * alguns parágrafos. Um modelo que lê isso gasta a maior parte do contexto em
 * marcação. Aqui ele recebe só o artigo.
 *
 * Anunciado no `/llms.txt` (cada artigo aponta pra sua versão em texto) e no
 * cabeçalho `Link: rel="alternate"` da própria página HTML — os dois caminhos
 * que um rastreador usa pra descobrir uma representação alternativa.
 *
 * 🔒 Só serve o que JÁ é público: a lista vem de `lerPosts`, que filtra
 * `published = true`. Artigo em rascunho responde 404 aqui, igual à página.
 *
 * ⚠️ Serve mesmo com o site em NOINDEX, igual ao `/llms.txt`: quem barra o
 * rastreamento é o robots.txt. Isso permite conferir o conteúdo antes do
 * go-live sem abrir nada.
 */
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const posts = await lerPosts();
  const post = posts.find((p) => p.slug === slug);

  // Rascunho e placeholder respondem 404 — mesma regra da página HTML.
  // Anunciar "conteúdo em preparação" pra uma IA é pior que não anunciar:
  // ela pode citar o stub como se fosse a resposta da Somatec.
  if (!post || post.placeholder) {
    return new Response('Artigo não encontrado.\n', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const html = (await lerHtmlBruto(slug)) ?? '';
  const corpo = htmlParaMarkdown(html);

  // Sem corpo, 404 — não serve cabeçalho sozinho.
  //
  // Acontece de verdade: artigo que vem do acervo em ARQUIVO (fallback quando
  // o banco não responde) tem o texto em `blog-content.ts`, não no HTML do
  // CMS, então `lerHtmlBruto` volta vazio. Entregar título + resumo e mais
  // nada é o mesmo problema do stub: a IA cita como se fosse a resposta da
  // Somatec sobre o tema, e a resposta é uma casca.
  //
  // O `/llms-full.txt` já pulava esse caso (`if (!corpo) continue`); aqui
  // faltava — achado conferindo a rota em produção.
  if (!corpo) {
    return new Response('Artigo sem conteúdo em texto.\n', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const cabecalho = [
    `# ${post.titulo}`,
    '',
    post.excerpt ? `> ${post.excerpt}` : '',
    '',
    `Fonte: ${SITE.url}/blog/${post.slug}`,
    post.publicadoEm ? `Publicado em: ${post.publicadoEm}` : '',
    post.cluster ? `Tema: ${post.cluster}` : '',
    '',
    '---',
    '',
  ]
    .filter((l) => l !== '')
    .join('\n');

  return new Response(`${cabecalho}\n${corpo}\n`, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
