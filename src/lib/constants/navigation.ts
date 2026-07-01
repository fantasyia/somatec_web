export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
};

export const HEADER_NAV: NavItem[] = [
  {
    label: 'A Somatec',
    href: '/a-msm',
    children: [
      { label: 'Quem somos', href: '/a-msm/quem-somos' },
      { label: 'Estrutura industrial', href: '/a-msm/estrutura-industrial' },
      {
        label: 'Qualidade e normas',
        href: '/a-msm/qualidade-e-seguranca',
      },
    ],
  },
  { label: 'Tecnologia', href: '/produtos' },
  {
    label: 'Soluções',
    href: '/solucoes',
    children: [
      {
        label: 'Proteção contra surtos',
        href: '/solucoes',
        description: 'MasterBlock — supressor com atuação em 100 kHz.',
      },
      {
        label: 'Qualidade de energia',
        href: '/solucoes',
        description: 'Diagnóstico e correção da qualidade de energia da planta.',
      },
      {
        label: 'Medições e laudos',
        href: '/solucoes',
        description: 'Ensaios e laudos técnicos conforme as normas.',
      },
      {
        label: 'Manutenção',
        href: '/solucoes',
        description: 'Manutenção elétrica industrial especializada.',
      },
    ],
  },
  { label: 'Resultados', href: '/blog' },
  { label: 'Contato', href: '/contato' },
];

export const HEADER_CTAS = {
  representative: { label: 'Área do Representante', href: '/login' },
  commercial: { label: 'Fale com o Comercial', href: '/contato' },
} as const;

export const FOOTER_COLUMNS: { title: string; links: NavItem[] }[] = [
  {
    title: 'A Somatec',
    links: [
      { label: 'Quem somos', href: '/a-msm/quem-somos' },
      { label: 'Estrutura industrial', href: '/a-msm/estrutura-industrial' },
      { label: 'Qualidade e normas', href: '/a-msm/qualidade-e-seguranca' },
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
      { label: 'Proteção contra surtos', href: '/solucoes' },
      { label: 'Qualidade de energia', href: '/solucoes' },
      { label: 'Medições e laudos', href: '/solucoes' },
      { label: 'Manutenção', href: '/solucoes' },
    ],
  },
  {
    title: 'Contato',
    links: [
      { label: 'Fale com o comercial', href: '/contato' },
      { label: 'Perguntas frequentes', href: '/faq' },
      { label: 'Política de privacidade', href: '/politica-de-privacidade' },
      { label: 'Termos de uso', href: '/termos-de-uso' },
    ],
  },
];
