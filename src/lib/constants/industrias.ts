/**
 * Landings por setor do ICP — cada uma casada com um case real (CASES).
 * Dor, sintomas e decisor vêm do playbook/ICP oficial da Somatec.
 */
import { CASES, type Case } from '@/lib/constants/cases';

export type Industria = {
  slug: string;
  nome: string;
  eyebrow: string;
  heroTitle: string;
  intro: string;
  sintomas: string[];
  decisor: string;
  caseSlug: string;
};

export const INDUSTRIAS: readonly Industria[] = [
  {
    slug: 'alimenticia',
    nome: 'Alimentícia',
    eyebrow: 'Proteção elétrica para a indústria alimentícia',
    heroTitle: 'Quando a linha para, a produção e a matéria-prima vão junto',
    intro:
      'Na indústria de alimentos, uma parada não programada não custa só o tempo: custa o lote em processo, a matéria-prima perdida e o risco sanitário. Empacotadoras, esteiras e sistemas de inspeção travam e queimam placas por distúrbios elétricos de alta frequência que a proteção comum não enxerga.',
    sintomas: [
      'Queima de placas das máquinas de empacotamento e envase',
      'Falhas intermitentes nos sistemas de inspeção e pesagem',
      'Paradas de linha sem causa aparente, com perda de lote',
    ],
    decisor: 'Gerência de manutenção e engenharia de fábrica',
    caseSlug: 'nissin',
  },
  {
    slug: 'autopecas',
    nome: 'Autopeças',
    eyebrow: 'Proteção elétrica para autopeças',
    heroTitle: 'Centros de usinagem não podem parar por um transiente',
    intro:
      'Em autopeças, cada centro de usinagem parado é linha inteira comprometida. Os CNCs e servos são sensíveis a variações de tensão de curtíssima duração (VTCD) — o tipo de distúrbio que DPS, no-break e aterramento não filtram, mas que queima placa e derruba a produção.',
    sintomas: [
      'Centros de usinagem (CNC) travando ou reiniciando sozinhos',
      'Queima recorrente de placas, servos e fontes',
      'Paradas de linha que já resistiram a soluções de grandes marcas',
    ],
    decisor: 'Engenharia de manutenção e direção industrial',
    caseSlug: 'cinpal',
  },
  {
    slug: 'metalurgia',
    nome: 'Metalúrgica',
    eyebrow: 'Proteção elétrica para metalurgia e fundição',
    heroTitle: 'Equipamento pesado gera surto — e o eletrônico ao lado paga a conta',
    intro:
      'Fornos, prensas e estamparia geram surto interno constante. Esse ruído elétrico de alta frequência trava os computadores de controle e queima as placas eletrônicas da própria planta — um custo diário que passa despercebido até virar reprogramação e reposição.',
    sintomas: [
      'Computadores de controle travando todos os dias',
      'Queima frequente de placas eletrônicas',
      'Tempo perdido diariamente com reprogramação',
    ],
    decisor: 'Manutenção elétrica e gestão de produção',
    caseSlug: 'stampline',
  },
  {
    slug: 'textil',
    nome: 'Têxtil',
    eyebrow: 'Proteção elétrica para a indústria têxtil',
    heroTitle: 'Cada queima de equipamento é um dia de produção que não volta',
    intro:
      'Na têxtil, as queimas frequentes de equipamentos não param só a máquina — param dias inteiros de produção. Distúrbios elétricos de alta frequência atingem os sistemas de tinturaria, fiação e tecelagem, e o prejuízo se acumula em capacidade produtiva perdida.',
    sintomas: [
      'Queimas frequentes de equipamentos de tinturaria e tecelagem',
      'Paradas que se estendem por dias até a reposição',
      'Perda relevante da capacidade produtiva mensal',
    ],
    decisor: 'Direção industrial e manutenção',
    caseSlug: 'grow-up',
  },
] as const;

export function getIndustria(slug: string): (Industria & { case: Case | undefined }) | undefined {
  const ind = INDUSTRIAS.find((i) => i.slug === slug);
  if (!ind) return undefined;
  return { ...ind, case: CASES.find((c) => c.slug === ind.caseSlug) };
}
