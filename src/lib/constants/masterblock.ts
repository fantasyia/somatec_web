/**
 * Fonte ÚNICA dos dados da linha Master Block (MB-01 a MB-12).
 * Consumida por /produtos (tabela) e /ferramentas/qual-master-block (seletor),
 * pra as duas nunca divergirem.
 *
 * Corrente de carga (loadLabel/loadMax): Tabela de Potências Master Block 2026 (Leandro).
 * Surto / nominal / dimensões / peso: folha de dados MasterBlock.
 * Toda a linha opera na mesma faixa de tensão (MB_TENSAO).
 * NÃO inventar valores — só o que veio dos documentos oficiais.
 */

export type MasterBlockModel = {
  model: string;
  /** Faixa de corrente de carga do circuito, para exibição. */
  loadLabel: string;
  /** Limite superior da faixa de corrente (A) — usado na seleção. */
  loadMax: number;
  /** Máxima corrente de surto 8/20 µs (Imax). */
  surge: string;
  /** In — corrente nominal de descarga. */
  nominal: string;
  /** Dimensões C × L × A (mm). */
  dim: string;
  /** Peso (kg). */
  weight: string;
  /** Preço de VENDA em R$ (tabela Leandro 2026). Locação não é exibida no site. */
  preco: number;
};

/** Formata um valor em Reais (sem centavos). */
export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/** Faixa de tensão comum a toda a linha (Tabela de Potências 2026). */
export const MB_TENSAO = '110 V a 1100 V';

/** Maior corrente de carga coberta pela linha padrão (A). */
export const MB_LOAD_MAX = 6300;

export const MASTER_BLOCK_MODELS: readonly MasterBlockModel[] = [
  { model: 'MB-01', loadLabel: '1 – 125 A', loadMax: 125, surge: '8 kA', nominal: '3 kA', dim: '150 × 100 × 60', weight: '1,4', preco: 3150 },
  { model: 'MB-02', loadLabel: '125 – 250 A', loadMax: 250, surge: '16 kA', nominal: '6 kA', dim: '150 × 100 × 60', weight: '1,6', preco: 4120 },
  { model: 'MB-03', loadLabel: '250 – 400 A', loadMax: 400, surge: '24 kA', nominal: '9 kA', dim: '200 × 100 × 70', weight: '1,8', preco: 5250 },
  { model: 'MB-04', loadLabel: '400 – 500 A', loadMax: 500, surge: '32 kA', nominal: '12 kA', dim: '200 × 100 × 70', weight: '2,0', preco: 7040 },
  { model: 'MB-05', loadLabel: '500 – 630 A', loadMax: 630, surge: '40 kA', nominal: '15 kA', dim: '200 × 150 × 90', weight: '3,4', preco: 9230 },
  { model: 'MB-06', loadLabel: '630 – 800 A', loadMax: 800, surge: '48 kA', nominal: '18 kA', dim: '200 × 150 × 90', weight: '3,7', preco: 11850 },
  { model: 'MB-07', loadLabel: '800 – 1000 A', loadMax: 1000, surge: '56 kA', nominal: '21 kA', dim: '250 × 200 × 100', weight: '5,2', preco: 15960 },
  { model: 'MB-08', loadLabel: '1000 – 1250 A', loadMax: 1250, surge: '64 kA', nominal: '24 kA', dim: '250 × 200 × 100', weight: '5,5', preco: 23850 },
  { model: 'MB-09', loadLabel: '1250 – 1600 A', loadMax: 1600, surge: '72 kA', nominal: '27 kA', dim: '280 × 220 × 100', weight: '8,2', preco: 27150 },
  { model: 'MB-10', loadLabel: '1600 – 2500 A', loadMax: 2500, surge: '80 kA', nominal: '30 kA', dim: '280 × 220 × 100', weight: '8,5', preco: 36620 },
  { model: 'MB-11', loadLabel: '2500 – 3200 A', loadMax: 3200, surge: '88 kA', nominal: '33 kA', dim: '350 × 260 × 120', weight: '13,5', preco: 55760 },
  { model: 'MB-12', loadLabel: '3200 – 6300 A', loadMax: 6300, surge: '100 kA', nominal: '37 kA', dim: '350 × 260 × 120', weight: '14,0', preco: 83930 },
] as const;

/**
 * Seleciona o modelo pela corrente de carga do circuito (A).
 * Retorna null se a corrente for inválida (≤0) ou acima da linha padrão (> MB_LOAD_MAX).
 */
export function selecionarMasterBlock(correnteA: number): MasterBlockModel | null {
  if (!Number.isFinite(correnteA) || correnteA <= 0) return null;
  if (correnteA > MB_LOAD_MAX) return null;
  return MASTER_BLOCK_MODELS.find((m) => correnteA <= m.loadMax) ?? null;
}
