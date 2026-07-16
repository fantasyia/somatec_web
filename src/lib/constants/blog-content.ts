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
};

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

/** Mapa slug → conteúdo. Só o artigo DEMO está preenchido (validação de template). */
const ARTICLE_CONTENT: Record<string, ArticleContent> = {
  'quanto-custa-1-hora-de-linha-parada': DEMO,
};

export function getArticleContent(slug: string): ArticleContent | undefined {
  return ARTICLE_CONTENT[slug];
}
