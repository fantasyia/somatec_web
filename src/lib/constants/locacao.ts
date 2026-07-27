// =============================================================================
// LOCAÇÃO INDUSTRIAL — dimensionamento + custo estimado.
//
// 🚨🚨 VALORES FICTÍCIOS / DE TESTE 🚨🚨
// Autorizado pelo Léo (2026-07-27) SÓ para destravar o teste da jornada
// completa enquanto a tabela real não chega. O site está NOINDEX e NÃO vai ao
// ar assim.
//
// ⛔ BLOQUEIO DE GO-LIVE: enquanto `VALORES_SIMULADOS` for true, a interface
// exibe um aviso de simulação em cima do resultado. Trocar pelos números reais
// = editar SÓ este arquivo e virar a flag pra false. Nenhum outro arquivo tem
// preço ou regra de dimensionamento de locação.
//
// Pendentes do Leandro/Léo pra virar real:
//   1. tabela de preços de LOCAÇÃO (mensalidade por modelo/camada)
//   2. regra de dimensionamento: tipo de componente → corrente → modelo/qtd MB
// =============================================================================

/** ⛔ true = os números abaixo são inventados. Vira false só com a tabela real. */
export const VALORES_SIMULADOS = true;

/** Camadas da proteção em cascata (do topo da planta pra base). */
export type CamadaId = 'entrada' | 'painel' | 'equipamento';

export type Camada = {
  id: CamadaId;
  nome: string;
  descricao: string;
  /** Mensalidade de locação por Master Block nesta camada (R$). FICTÍCIO. */
  mensalidade: number;
};

export const CAMADAS: readonly Camada[] = [
  {
    id: 'entrada',
    nome: 'Entrada de energia',
    descricao: 'Master Block na entrada/subestação — barra o surto antes de ele entrar na planta.',
    mensalidade: 1850,
  },
  {
    id: 'painel',
    nome: 'Painéis de distribuição',
    descricao: 'Um por painel de baixa tensão — protege o que cada galpão alimenta.',
    mensalidade: 1200,
  },
  {
    id: 'equipamento',
    nome: 'Equipamentos críticos',
    descricao: 'Junto dos servomotores, servodrivers, servobombas e inversores.',
    mensalidade: 780,
  },
];

/** Pontos sensíveis cobertos por 1 Master Block na camada de equipamento. FICTÍCIO. */
const PONTOS_POR_MB = 12;

export type LinhaProjeto = {
  camada: Camada;
  quantidade: number;
  subtotal: number;
};

export type ProjetoLocacao = {
  linhas: LinhaProjeto[];
  totalMB: number;
  /** Mensalidade estimada somando as camadas (R$). */
  mensalidadeTotal: number;
};

/**
 * Dimensiona o projeto em cascata a partir do que o cliente montou no wizard.
 * REGRA FICTÍCIA (substituir pela do Leandro):
 *   • 1 MB na entrada (sempre)
 *   • 1 MB por painel de distribuição informado
 *   • 1 MB a cada 12 pontos sensíveis (arredondando pra cima)
 */
export function dimensionarLocacao(entrada: {
  paineis: number;
  pontosSensiveis: number;
}): ProjetoLocacao {
  const qtd: Record<CamadaId, number> = {
    entrada: 1,
    painel: Math.max(0, Math.floor(entrada.paineis)),
    equipamento: Math.ceil(Math.max(0, entrada.pontosSensiveis) / PONTOS_POR_MB),
  };

  const linhas = CAMADAS.filter((c) => qtd[c.id] > 0).map((camada) => ({
    camada,
    quantidade: qtd[camada.id],
    subtotal: qtd[camada.id] * camada.mensalidade,
  }));

  return {
    linhas,
    totalMB: linhas.reduce((s, l) => s + l.quantidade, 0),
    mensalidadeTotal: linhas.reduce((s, l) => s + l.subtotal, 0),
  };
}
