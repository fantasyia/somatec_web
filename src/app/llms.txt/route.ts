import { SITE, CONTACT } from '@/lib/constants/site';
import { lerPosts } from '@/lib/blog/fonte';

/**
 * /llms.txt — índice do site em texto, pro buscador de IA (GEO).
 *
 * Por que existe: ChatGPT, Perplexity e afins não rastreiam como o Google.
 * Eles buscam um resumo curto e navegável do site em vez de rastejar HTML
 * cheio de script. O llms.txt é a convenção pra isso — um mapa em markdown,
 * em texto puro, com um link e uma linha de descrição por página.
 *
 * Não substitui o sitemap.xml: o sitemap é pra rastreador clássico descobrir
 * URL; este arquivo é pra a IA entender o que cada URL É antes de decidir
 * buscar. Os dois convivem e apontam pro mesmo conteúdo.
 *
 * ⚠️ As descrições aqui são FUNCIONAIS (dizem o que a página contém), não
 * copy de venda. Copy é decisão do orquestrador — se ele quiser reescrever,
 * é só trocar as strings deste arquivo.
 *
 * O arquivo é servido sempre, inclusive com o site em NOINDEX. Quem barra o
 * rastreamento é o robots.txt; servir aqui permite conferir o conteúdo antes
 * do go-live sem abrir nada.
 */
export const dynamic = 'force-dynamic';

type Link = { href: string; desc: string };

const INSTITUCIONAL: Link[] = [
  { href: '/', desc: 'Home. O problema do surto elétrico e as três frentes: indústria, comércio e residência.' },
  { href: '/produtos', desc: 'Master Block: os 12 modelos por faixa de corrente, com Icc, especificação técnica e preço.' },
  { href: '/a-somatec', desc: 'Índice institucional da empresa.' },
  { href: '/a-somatec/quem-somos', desc: 'História, 26 anos de mercado e Prêmio FIESP Acelera Startup 2015.' },
  { href: '/a-somatec/tecnologia-e-fabricacao', desc: 'Como o filtro híbrido funciona e por que atua em 100 kHz, contra os 10 kHz do DPS comum. Fabricação própria.' },
  { href: '/a-somatec/comprovacao-e-normas', desc: 'Normas atendidas (ABNT NBR 5410, IEC 61643-1) e como a proteção é comprovada por medição.' },
  { href: '/resultados', desc: 'Cases com números medidos em planta: supressão de VTCD, prejuízo cessado e retorno.' },
  { href: '/faq', desc: 'Perguntas frequentes sobre proteção contra surto, instalação e garantia.' },
  { href: '/contato', desc: 'Canal comercial. Atendimento por WhatsApp e formulário; não há atendimento telefônico.' },
  { href: '/representantes', desc: 'Programa de representação comercial.' },
];

const SEGMENTOS: Link[] = [
  { href: '/protecao-residencial', desc: 'Residências de alto padrão: automação, home theater, ar-condicionado, inversor solar e carro elétrico na mesma rede.' },
  { href: '/protecao-comercial', desc: 'Comércio: câmara fria, PDV, servidores e ar-condicionado — o que para quando a energia falha.' },
  { href: '/industrias/alimenticia', desc: 'Indústria alimentícia: cadeia do frio e perda de lote.' },
  { href: '/industrias/autopecas', desc: 'Autopeças: linha parada e queima de placa em CLP.' },
  { href: '/industrias/metalurgia', desc: 'Metalurgia: forno, carga pesada e VTCD.' },
  { href: '/industrias/textil', desc: 'Têxtil: tecelagem, tinturaria e fiação.' },
];

const FERRAMENTAS: Link[] = [
  { href: '/ferramentas/custo-de-parada', desc: 'Calculadora: quanto custa uma hora de parada na sua operação.' },
  { href: '/orcamento-industrial', desc: 'Avaliação para planta industrial, com medição na própria instalação.' },
];

function secao(titulo: string, links: Link[], base: string): string {
  const linhas = links.map((l) => `- [${l.href}](${base}${l.href}): ${l.desc}`);
  return `## ${titulo}\n\n${linhas.join('\n')}\n`;
}

export async function GET(): Promise<Response> {
  const base = SITE.url;

  // Artigos: só os que têm conteúdo de verdade. Entrada estrutural
  // (placeholder) não entra — anunciar "conteúdo em preparação" pra uma IA é
  // pior que não anunciar nada, porque ela pode citar o stub.
  let blog = '';
  try {
    const posts = (await lerPosts()).filter((p) => !p.placeholder);
    if (posts.length > 0) {
      const linhas = posts.map(
        (p) => `- [${p.titulo}](${base}/blog/${p.slug}): ${p.excerpt}`,
      );
      blog = `## Blog\n\n- [/blog](${base}/blog): Índice dos artigos.\n${linhas.join('\n')}\n`;
    }
  } catch {
    // Blog fora do ar não pode derrubar o índice inteiro — o resto do arquivo
    // continua útil. Mesma postura do sitemap.
  }

  const corpo = [
    `# ${SITE.fullName}`,
    '',
    `> ${SITE.description}`,
    '',
    'Fabricante brasileiro de supressores de surto e soluções de qualidade de energia.',
    `Contato comercial: ${CONTACT.email} · WhatsApp ${CONTACT.whatsappDisplay}`,
    `Endereço: ${CONTACT.address}`,
    '',
    secao('Institucional', INSTITUCIONAL, base),
    secao('Por segmento', SEGMENTOS, base),
    secao('Ferramentas', FERRAMENTAS, base),
    blog,
    '## Observações',
    '',
    `- Sitemap XML: ${base}/sitemap.xml`,
    '- Todo dado numérico citado no site vem de medição em cliente real, com o case identificado na página de resultados.',
    '- O Master Block é equipamento; não há venda de software ou de monitoramento em separado.',
  ]
    .filter(Boolean)
    .join('\n');

  return new Response(`${corpo}\n`, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
