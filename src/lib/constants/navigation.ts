import { whatsappHref } from '@/lib/constants/site';

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
};

// TODO item do nav abre o mesmo painel — nada de item "morto" no hover.
// Regra: o `description` de cada filho é resumo da própria página de destino
// (metadata), não claim novo.
//
// ⛔ NÃO recriar o seletor "descubra seu modelo". A jornada do cliente é
// LP → calculadora; um atalho pra escolher modelo solto fura essa trilha e
// entrega dimensionamento (e antes até preço) sem contexto de público.
export const HEADER_NAV: NavItem[] = [
  {
    label: 'A Somatec',
    href: '/a-somatec',
    children: [
      {
        label: 'Quem somos',
        href: '/a-somatec/quem-somos',
        description: 'Quem está por trás da tecnologia, desde 1998.',
      },
      {
        label: 'Tecnologia e fabricação',
        href: '/a-somatec/tecnologia-e-fabricacao',
        description: 'Como o Master Block é projetado e fabricado.',
      },
      {
        label: 'Comprovação e normas',
        href: '/a-somatec/comprovacao-e-normas',
        description: 'DPS Classe III — ABNT NBR IEC 61643-1 e NBR 5410.',
      },
    ],
  },
  {
    label: 'Tecnologia',
    href: '/produtos',
    children: [
      {
        label: 'Master Block',
        href: '/produtos',
        description: 'Supressor com filtro passivo atuante em 100 kHz — não é um DPS comum.',
      },
      {
        label: 'Comprovação e normas',
        href: '/a-somatec/comprovacao-e-normas',
        description: '12 modelos de 8 kA a 100 kA, dentro da norma.',
      },
      {
        label: 'Tecnologia e fabricação',
        href: '/a-somatec/tecnologia-e-fabricacao',
        description: 'Como o Master Block é projetado e fabricado.',
      },
    ],
  },
  {
    label: 'Soluções',
    href: '/solucoes',
    children: [
      {
        label: 'Proteção contra surtos',
        href: '/solucoes/protecao-contra-surtos',
        description: 'Master Block — supressor com atuação em 100 kHz.',
      },
      {
        label: 'Qualidade de energia',
        href: '/solucoes/qualidade-de-energia',
        description: 'Software on-line que comprova a proteção em tempo real.',
      },
      {
        label: 'Banco de capacitores',
        href: '/solucoes/banco-de-capacitores',
        description: 'Correção do fator de potência e fim das multas por reativo.',
      },
      {
        label: 'Medição e laudos',
        href: '/solucoes/medicao-e-laudos',
        description: 'Diagnóstico técnico da qualidade da sua energia.',
      },
      {
        label: 'Manutenção de cabine',
        href: '/solucoes/manutencao-cabine-primaria',
        description: 'Confiabilidade elétrica sem paradas não programadas.',
      },
    ],
  },
  {
    label: 'Resultados',
    href: '/resultados',
    children: [
      {
        label: 'Cases com número',
        href: '/resultados',
        description: 'Medição antes e depois da instalação do Master Block.',
      },
      {
        label: 'Blog',
        href: '/blog',
        description: 'Proteção elétrica, VTCD e custo de parada, sem enrolação.',
      },
      {
        label: 'Perguntas frequentes',
        href: '/faq',
        description: 'Respostas técnicas sobre Master Block, VTCD e o modelo sem risco.',
      },
    ],
  },
  {
    label: 'Diagnóstico',
    href: '/ferramentas/custo-de-parada',
    children: [
      {
        label: 'Custo de parada',
        href: '/ferramentas/custo-de-parada',
        description: 'Coloque seus números e veja o prejuízo anual que a proteção comum não evita.',
      },
      {
        label: 'Projeto da sua planta',
        href: '/orcamento-industrial',
        description: 'Remonte a árvore da planta e receba a proposta de proteção em cascata.',
      },
    ],
  },
  {
    label: 'Contato',
    href: '/contato',
    children: [
      {
        label: 'Fale com o comercial',
        href: '/contato',
        description: 'Diagnóstico de qualidade de energia e proteção contra surtos.',
      },
      {
        label: 'Proteção para minha casa',
        href: '/protecao-residencial',
        description: 'Automação, home theater, solar e carro elétrico na mesma rede.',
      },
      {
        label: 'Proteção para meu negócio',
        href: '/protecao-comercial',
        description: 'Câmara fria, freezers e PDV protegidos de uma vez.',
      },
      {
        label: 'Seja um representante',
        href: '/representantes',
        description: 'Represente ou indique as soluções da Somatec Blocking.',
      },
    ],
  },
];

// "Fale com o Comercial" abre o WhatsApp DIRETO (Léo, 21/08) — quem clica ali
// quer falar com gente, não preencher formulário. O formulário de /contato
// continua existindo pra quem prefere escrever.
export const HEADER_CTAS = {
  representative: { label: 'Área do Representante', href: '/login' },
  commercial: {
    label: 'Fale com o Comercial',
    href: whatsappHref('Olá! Vim pelo site da Somatec Blocking e gostaria de falar com o comercial.'),
    externo: true,
  },
} as const;

export const FOOTER_COLUMNS: { title: string; links: NavItem[] }[] = [
  {
    title: 'A Somatec',
    links: [
      { label: 'Quem somos', href: '/a-somatec/quem-somos' },
      { label: 'Tecnologia e fabricação', href: '/a-somatec/tecnologia-e-fabricacao' },
      { label: 'Comprovação e normas', href: '/a-somatec/comprovacao-e-normas' },
    ],
  },
  {
    title: 'Tecnologia',
    links: [
      { label: 'MasterBlock', href: '/produtos' },
      { label: 'Modelos MB-01 a MB-12', href: '/produtos' },
    ],
  },
  {
    title: 'Soluções',
    links: [
      { label: 'Proteção contra surtos', href: '/solucoes/protecao-contra-surtos' },
      { label: 'Qualidade de energia', href: '/solucoes/qualidade-de-energia' },
      { label: 'Banco de capacitores', href: '/solucoes/banco-de-capacitores' },
      { label: 'Medição e laudos', href: '/solucoes/medicao-e-laudos' },
      { label: 'Manutenção de cabine', href: '/solucoes/manutencao-cabine-primaria' },
    ],
  },
  {
    title: 'Conteúdo',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Resultados e cases', href: '/resultados' },
      { label: 'Diagnóstico de VTCD', href: '/ferramentas/custo-de-parada' },
      { label: 'Orçamento industrial (locação)', href: '/orcamento-industrial' },
    ],
  },
  {
    title: 'Contato',
    links: [
      { label: 'Fale com o comercial', href: '/contato' },
      { label: 'Proteção pra minha casa', href: '/protecao-residencial' },
      { label: 'Proteção pro meu negócio', href: '/protecao-comercial' },
      { label: 'Perguntas frequentes', href: '/faq' },
      { label: 'Política de privacidade', href: '/politica-de-privacidade' },
      { label: 'Termos de uso', href: '/termos-de-uso' },
    ],
  },
];
