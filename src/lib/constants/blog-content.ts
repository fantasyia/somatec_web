/**
 * Corpo dos artigos — separado do índice (BlogPost) porque, no WP, vem do campo
 * `content` do post. Aqui só existe 1 artigo DEMO estrutural para validar o
 * template no localhost. O CONTEÚDO REAL é escrito pela sessão de blog/redação;
 * este texto é placeholder de demonstração e NÃO é copy oficial.
 */

export type ArticleImage = { url: string; legenda: string; alt: string };

export type ArticleSection = {
  /** âncora usada pelo TOC e pelo scrollspy. */
  id: string;
  titulo: string;
  paragrafos: string[];
  imagem?: ArticleImage;
  subsecoes?: { titulo: string; paragrafos: string[] }[];
};

export type ArticleFaq = { pergunta: string; resposta: string };

export type ArticleContent = {
  /** Box "Resposta rápida" (2-3 linhas) — alvo de featured snippet. */
  respostaRapida: string;
  atualizadoEm?: string;
  secoes: ArticleSection[];
  faq: ArticleFaq[];
  /** ⚠️ TEMP (despacho #13): stub de validação interna — renderiza o aviso
   *  "conteúdo em preparação" no artigo. Some quando a redação entregar o
   *  texto real. NÃO lançar publicamente com isso true. */
  emPreparacao?: boolean;
};

/** ⚠️ TEMP (despacho #13) — corpo PLACEHOLDER de validação interna: alimenta
 *  o portão estrutural (post só renderiza com corpo) SÓ pra o artigo passar a
 *  existir e o Leandro validar layout/navegação. O portão PERMANECE — isto é
 *  um stub nele, não a remoção. Antes do go-live público, o conteúdo REAL
 *  (master + sessão de blog) substitui cada stub. */
function stubEmPreparacao(): ArticleContent {
  return {
    respostaRapida:
      'Conteúdo em preparação pela redação da Somatec. Esta página está no ar para validação interna de layout e navegação.',
    secoes: [
      {
        id: 'em-preparacao',
        titulo: 'Conteúdo em preparação',
        paragrafos: [
          'O texto completo deste artigo está sendo preparado pela redação da Somatec e substituirá esta página antes do lançamento. A estrutura que você vê aqui — título, capa, tempo de leitura e navegação — já é a definitiva.',
        ],
      },
    ],
    faq: [],
    emPreparacao: true,
  };
}

const DEMO: ArticleContent = {
  respostaRapida:
    'Uma hora de linha parada custa muito mais do que a produção que deixou de sair: entram refugo, hora extra, multa por atraso e o equipamento queimado. Somando tudo, o valor real costuma ser 3 a 5 vezes maior do que a estimativa inicial da gestão.',
  atualizadoEm: '2026-07-15',
  secoes: [
    {
      id: 'introducao',
      titulo: 'Por que a conta da parada é maior do que parece',
      paragrafos: [
        '⚠️ Artigo de demonstração — este texto existe apenas para validar a estrutura do template. O conteúdo real será escrito e publicado pela redação da Somatec.',
        'Parágrafo de exemplo mostrando a largura de leitura confortável (~68 caracteres por linha), o tamanho de fonte do corpo e o espaçamento generoso entre linhas e blocos, como um artigo técnico longo pede.',
      ],
    },
    {
      id: 'componentes-do-custo',
      titulo: 'Os componentes que entram na conta',
      paragrafos: [
        'Cada seção H2 vira um item do índice (TOC) na lateral. Este parágrafo demonstra o fluxo de leitura do corpo do artigo dentro da coluna principal.',
      ],
      subsecoes: [
        {
          titulo: 'Custo direto de produção',
          paragrafos: ['Exemplo de subseção (H3) sob um H2 — demonstra a hierarquia tipográfica.'],
        },
        {
          titulo: 'Custos ocultos',
          paragrafos: ['Refugo, retrabalho, hora extra e multa de prazo — texto de demonstração.'],
        },
      ],
    },
    {
      id: 'como-medir',
      titulo: 'Como medir o custo na sua planta',
      paragrafos: [
        'Bloco de imagem inline com legenda e alt text, no formato que o Estúdio entregará via brief da master:',
      ],
      imagem: {
        url: '/blog/custo-hora-parada.jpg',
        legenda: 'Exemplo de imagem inline com legenda descritiva (placeholder de demonstração).',
        alt: 'Linha de produção industrial com sinaleiro de parada aceso',
      },
    },
    {
      id: 'conclusao',
      titulo: 'Conclusão',
      paragrafos: [
        'Fechamento do artigo de demonstração, seguido do CTA de diagnóstico (banda navy padrão do site) e dos 3 artigos relacionados.',
      ],
    },
  ],
  faq: [
    {
      pergunta: 'Pergunta frequente de exemplo 1?',
      resposta:
        'Resposta de demonstração — no artigo real, o par pergunta/resposta alimenta o schema FAQPage para aparecer como rich snippet na busca.',
    },
    {
      pergunta: 'Pergunta frequente de exemplo 2?',
      resposta: 'Resposta de demonstração para validar o bloco de FAQ do template.',
    },
    {
      pergunta: 'Pergunta frequente de exemplo 3?',
      resposta: 'Resposta de demonstração para validar o bloco de FAQ do template.',
    },
  ],
};

/** Mapa slug → conteúdo. DEMO = validação de template; os stubs são o estado
 *  TEMPORÁRIO de validação com o Leandro (despacho #13) — os 4 artigos do
 *  teaser da home passam no portão e renderizam com o aviso visível. */
const ARTICLE_CONTENT: Record<string, ArticleContent> = {
  'quanto-custa-1-hora-de-linha-parada': { ...DEMO, emPreparacao: true },
  'no-break-nao-protege-contra-surto': stubEmPreparacao(),
  'protecao-contra-surtos-residencial': stubEmPreparacao(),
  'protecao-eletrica-para-comercio': stubEmPreparacao(),
};

export function getArticleContent(slug: string): ArticleContent | undefined {
  return ARTICLE_CONTENT[slug];
}
