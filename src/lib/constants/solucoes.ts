import { Zap, Gauge, BatteryCharging, ClipboardCheck, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Portfólio da Somatec Blocking: o Sistema Master Block (supressor de surtos +
 * software de gestão de energia on-line) e o Banco de Capacitores, mais 2
 * serviços. O antigo Retentor Eletromagnético foi DESCONTINUADO — o Master
 * Block é o filtro híbrido atual.
 */
export type Solucao = {
  slug: string;
  Icon: LucideIcon;
  title: string;
  tagline: string;
  eyebrow: string;
  intro: string[];
  highlights: { title: string; description: string }[];
  cta: string;
};

export const SOLUCOES: readonly Solucao[] = [
  {
    slug: 'protecao-contra-surtos',
    Icon: Zap,
    eyebrow: 'Produto',
    title: 'Proteção contra surtos e transientes',
    tagline: 'Master Block — o filtro híbrido que atua em 100 kHz',
    intro: [
      'O Master Block é um supressor e protetor contra surtos elétricos com filtro passivo que atua em 100 kHz — a faixa onde os DPS comuns (que atuam abaixo de 10 kHz) não chegam. É ali que estão os VTCD, as variações de tensão de curta duração, e os transientes que queimam placas, CLPs, servos e inversores.',
      'Patenteado e de fabricação exclusiva, o Master Block é instalado em paralelo no quadro de distribuição, em proteção em cascata (entrada da instalação, quadro e próximo ao equipamento sensível), com um sistema de aterramento dedicado conforme a NBR 5410.',
    ],
    highlights: [
      { title: '12 modelos (MB-01 a MB-12)', description: 'De 8 kA a 100 kA de corrente máxima de surto, para do pequeno comércio à indústria pesada.' },
      { title: 'DPS Classe III', description: 'Conforme ABNT NBR 5410 e IEC 61643-1, grau de proteção IP-65, de −40 °C a 60 °C.' },
      { title: 'Indicador de vida útil', description: 'Medidor mecânico frontal que sinaliza quando o protetor chega ao fim da vida útil.' },
    ],
    cta: 'Quero proteger minha planta',
  },
  {
    slug: 'qualidade-de-energia',
    Icon: Gauge,
    eyebrow: 'Sistema IoT',
    title: 'Gestão da qualidade de energia',
    tagline: 'Software on-line que comprova a proteção em tempo real',
    intro: [
      'O Sistema Master Block IoT não para na instalação do filtro. Um software de gestão on-line de qualidade de energia acompanha, em tempo real, a eficácia do Master Block na retenção dos picos de tensão, a sua vida útil e as condições gerais de qualidade de energia da rede.',
      'O sistema calcula continuamente o tempo de uso dos ativos e os níveis de distorção harmônica (THDv) — e, como a tolerância dos equipamentos cai conforme envelhecem, aponta quando os níveis já não são adequados e sugere um plano de ação preventivo. É a diferença entre proteger e comprovar que está protegendo.',
    ],
    highlights: [
      { title: 'Monitoramento contínuo', description: 'Nenhum DPS comum oferece acompanhamento on-line da qualidade de energia da rede.' },
      { title: 'Inspeções periódicas', description: 'Três visitas por ano avaliam as condições físicas do Master Block e da instalação.' },
      { title: 'Plano de ação preventivo', description: 'O sistema antecipa riscos com base na idade do ativo e nos níveis de THDv.' },
    ],
    cta: 'Quero medir a energia da minha rede',
  },
  {
    slug: 'banco-de-capacitores',
    Icon: BatteryCharging,
    eyebrow: 'Produto',
    title: 'Banco de Capacitores',
    tagline: 'Correção do fator de potência e fim das multas por reativo',
    intro: [
      'O Banco de Capacitores melhora a qualidade da energia elétrica consumida pelos equipamentos e instalações, corrigindo o fator de potência da planta.',
      'O resultado direto é a eliminação das multas por energia reativa na conta de luz e um melhor aproveitamento do consumo — redução de custos com ganho de eficiência energética.',
    ],
    highlights: [
      { title: 'Fim das multas por reativo', description: 'Correção do fator de potência para dentro dos limites da concessionária.' },
      { title: 'Melhor aproveitamento', description: 'Mais eficiência no consumo de energia da instalação.' },
      { title: 'Projeto sob medida', description: 'Dimensionado conforme a carga e o perfil de consumo da planta.' },
    ],
    cta: 'Quero corrigir meu fator de potência',
  },
  {
    slug: 'medicao-e-laudos',
    Icon: ClipboardCheck,
    eyebrow: 'Serviço',
    title: 'Medição e Laudos',
    tagline: 'Diagnóstico técnico da qualidade da sua energia',
    intro: [
      'Relatórios de medição com análise de energia para conhecer a real situação da rede elétrica da empresa — uma forma de evitar desperdícios e danos elétricos e de comprovar a eficiência dos transformadores.',
      'É o ponto de partida de qualquer projeto: a medição mostra a presença das perturbações às quais as falhas podem ser atribuídas e serve de base para o dimensionamento da proteção.',
    ],
    highlights: [
      { title: 'Análise de qualidade de energia', description: 'Identificação de VTCD, harmônicos e demais perturbações da rede.' },
      { title: 'Laudos técnicos', description: 'Documentação conforme as normas, útil inclusive para evitar multas na fatura.' },
      { title: 'Base para o projeto', description: 'A medição orienta o dimensionamento da proteção em cascata.' },
    ],
    cta: 'Quero um diagnóstico da minha rede',
  },
  {
    slug: 'manutencao-cabine-primaria',
    Icon: Wrench,
    eyebrow: 'Serviço',
    title: 'Manutenção de Cabine Primária',
    tagline: 'Confiabilidade elétrica sem interrupções não programadas',
    intro: [
      'Manutenção de cabines primárias e painéis para garantir o correto funcionamento da entrada de energia, evitando problemas, falhas e interrupções não programadas.',
      'Uma cabine bem mantida é a base de uma operação confiável — e complementa a estratégia de proteção contra surtos e de qualidade de energia da planta.',
    ],
    highlights: [
      { title: 'Prevenção de falhas', description: 'Inspeção e manutenção que evitam interrupções não programadas.' },
      { title: 'Segurança', description: 'Trabalhos conforme as normas, com o histórico de zero acidentes da Somatec.' },
      { title: 'Continuidade operacional', description: 'Menos paradas e mais previsibilidade para a produção.' },
    ],
    cta: 'Quero avaliar minha cabine primária',
  },
];

export const getSolucao = (slug: string) => SOLUCOES.find((s) => s.slug === slug);
