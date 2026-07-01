export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
};

export const HEADER_NAV: NavItem[] = [
  {
    label: 'A Somatec',
    href: '/a-somatec',
    children: [
      { label: 'Quem somos', href: '/a-somatec/quem-somos' },
      { label: 'Tecnologia e fabricação', href: '/a-somatec/tecnologia-e-fabricacao' },
      {
        label: 'Comprovação e normas',
        href: '/a-somatec/comprovacao-e-normas',
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
    title: 'Contato',
    links: [
      { label: 'Fale com o comercial', href: '/contato' },
      { label: 'Perguntas frequentes', href: '/faq' },
      { label: 'Política de privacidade', href: '/politica-de-privacidade' },
      { label: 'Termos de uso', href: '/termos-de-uso' },
    ],
  },
];
