/**
 * Cases reais quantificados — fonte única (home + página /resultados).
 * Números e empresas conforme o playbook de vendas oficial da Somatec.
 * NÃO inventar métrica, empresa ou cidade.
 */

export type Case = {
  slug: string;
  metric: string;
  unit: string;
  company: string;
  sector: string;
  city: string;
  /** Setor do ICP (slug) que este case atende — liga com /industrias/[setor]. */
  industria?: string;
  summary: string;
  detail: string;
};

export const CASES: readonly Case[] = [
  {
    slug: 'cinpal',
    metric: '92%',
    unit: 'de supressão de VTCD',
    company: 'Cinpal',
    sector: 'Autopeças',
    city: 'Taboão da Serra · SP',
    industria: 'autopecas',
    summary:
      'Medição com dois analisadores por 80 dias comprovou a supressão e cessou prejuízos de ~R$120 mil/mês com paradas.',
    detail:
      'Centros de usinagem paravam com transientes que a proteção existente não via. Após a instalação do Master Block, a medição antes/depois comprovou 92% de supressão dos VTCD e o fim das paradas — cerca de R$120 mil por mês que deixaram de ser perdidos.',
  },
  {
    slug: 'nissin',
    metric: '~R$1 mi',
    unit: 'por ano economizados',
    company: 'Nissin Foods',
    sector: 'Alimentícia',
    city: 'Ibiúna · SP',
    industria: 'alimenticia',
    summary:
      'Redução das falhas na inspeção e da queima de placas das máquinas de empacotamento — só em manutenção.',
    detail:
      'As máquinas de empacotamento queimavam placas e falhavam na inspeção por distúrbios de alta frequência na rede. O Master Block estabilizou a operação e a economia só em manutenção passou de R$1 milhão por ano.',
  },
  {
    slug: 'stampline',
    metric: 'R$560 mil',
    unit: 'por ano em placas',
    company: 'Stampline',
    sector: 'Metalúrgica',
    city: 'Limeira · SP',
    industria: 'metalurgia',
    summary:
      'Fim do travamento diário de computadores (40 min/dia de reprogramação) e da queima de placas eletrônicas.',
    detail:
      'Todo dia, 40 minutos eram gastos reprogramando computadores que travavam, além da queima recorrente de placas. A proteção em cascata com o Master Block acabou com os dois problemas — R$560 mil por ano que voltaram pro caixa.',
  },
  {
    slug: 'grow-up',
    metric: '4 dias',
    unit: 'de produção salvos por mês',
    company: 'Grow Up',
    sector: 'Têxtil',
    city: 'Cascavel · PR',
    industria: 'textil',
    summary:
      'Eliminação das queimas frequentes de equipamentos, que chegavam a parar até 4 dias por mês — mais de 13% da produção mensal.',
    detail:
      'Queimas frequentes de equipamentos paravam a produção em até 4 dias por mês — mais de 13% do total. Com o Master Block, as queimas foram eliminadas e a capacidade produtiva foi recuperada.',
  },
] as const;

/** Grandes indústrias atendidas (logos na home). */
export const CLIENTES = [
  'BASF',
  'Bosch',
  'Philips',
  'Colgate',
  'Johnson Controls',
  'Ambev',
  'Saint-Gobain',
  'Medley',
  'AkzoNobel',
  'Acrilex',
  'Kostal',
  'Lorenzetti',
  'Moura',
  'Extrafarma',
] as const;
