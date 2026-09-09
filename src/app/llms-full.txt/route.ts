import { SITE, CONTACT } from '@/lib/constants/site';
import { lerPosts, lerHtmlBruto } from '@/lib/blog/fonte';
import { htmlParaMarkdown } from '@/lib/blog/markdown';

/**
 * `/llms-full.txt` — o acervo INTEIRO em um arquivo, pro leitor de IA.
 *
 * A dupla da convenção: o `/llms.txt` é o índice (link + uma linha por
 * página), este é o conteúdo. Um modelo que chega aqui não precisa buscar
 * artigo por artigo — lê tudo de uma vez, na ordem, sem HTML no meio.
 *
 * ⚠️ Só o BLOG entra. As páginas institucionais são componentes React, não
 * markdown: extrair texto legível delas é trabalho de verdade e o resultado
 * seria pior que o `/llms.txt`, que já descreve cada uma em uma linha. Quando
 * valer a pena, entra aqui — a estrutura já comporta.
 *
 * 🔒 Só o que é público: `lerPosts` filtra `published = true`, e placeholder
 * fica de fora pelo mesmo motivo do `/llms.txt` — stub citado por IA vira
 * resposta falsa atribuída à Somatec.
 *
 * ⚠️ Sem artigo publicado o arquivo existe e diz que o acervo está em
 * preparação. É melhor que 404: 404 sugere que a convenção não é suportada, e
 * o rastreador pode não voltar.
 */
export const dynamic = 'force-dynamic';

/** Teto de segurança: acervo grande não pode virar resposta de dezenas de MB. */
const MAX_ARTIGOS = 200;

export async function GET(): Promise<Response> {
  const base = SITE.url;

  let artigos: string[] = [];
  let total = 0;
  try {
    const posts = (await lerPosts()).filter((p) => !p.placeholder);
    total = posts.length;
    for (const p of posts.slice(0, MAX_ARTIGOS)) {
      const html = (await lerHtmlBruto(p.slug)) ?? '';
      // O título do artigo entra como `##`; os títulos DELE descem um nível,
      // senão um `<h2>` do texto viraria irmão do título e a hierarquia do
      // arquivo se perderia justamente pra quem lê estrutura.
      const corpo = htmlParaMarkdown(html).replace(/^(#{1,5}) /gm, '#$1 ');
      if (!corpo) continue; // sem texto de verdade, não entra
      artigos.push(
        [
          `## ${p.titulo}`,
          '',
          `URL: ${base}/blog/${p.slug}`,
          p.publicadoEm ? `Publicado em: ${p.publicadoEm}` : '',
          p.cluster ? `Tema: ${p.cluster}` : '',
          '',
          corpo,
          '',
          '---',
        ]
          .filter((l) => l !== '')
          .join('\n'),
      );
    }
  } catch {
    // Blog fora do ar não pode derrubar o arquivo inteiro — o cabeçalho
    // institucional continua útil. Mesma postura do sitemap e do llms.txt.
    artigos = [];
  }

  const cabecalho = [
    `# ${SITE.fullName} — acervo completo`,
    '',
    `> ${SITE.description}`,
    '',
    'Fabricante brasileiro de supressores de surto e soluções de qualidade de energia.',
    `Contato comercial: ${CONTACT.email} · WhatsApp ${CONTACT.whatsappDisplay}`,
    `Endereço: ${CONTACT.address}`,
    '',
    `Índice do site: ${base}/llms.txt`,
    `Sitemap XML: ${base}/sitemap.xml`,
    '',
    // Os dois fatos que uma IA mais erra sobre a Somatec. Repetidos aqui de
    // propósito: quem lê este arquivo pode nunca ter lido o /llms.txt.
    '- Industrial é locação com mensalidade. Comércio e residência compram o equipamento direto pelo site.',
    '- O Master Block é equipamento; não há venda de software ou de monitoramento em separado.',
    '',
    '---',
    '',
  ].join('\n');

  const corpo = artigos.length
    ? `${cabecalho}\n${artigos.join('\n')}\n`
    : `${cabecalho}\nO acervo de artigos está em preparação. O índice do site segue disponível em ${base}/llms.txt\n`;

  const rodape =
    total > MAX_ARTIGOS
      ? `\n(${MAX_ARTIGOS} de ${total} artigos neste arquivo. Os demais estão em ${base}/llms.txt)\n`
      : '';

  return new Response(`${corpo}${rodape}`, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
