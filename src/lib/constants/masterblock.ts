/**
 * Fonte ÚNICA dos dados da linha Master Block (MB-01 a MB-12).
 *
 * Consumida por /produtos (tabela), CheckoutNI (dimensionamento e PREÇO que o
 * cliente paga), OrcamentoIndustrial, o PDF de projeto e a cotação de frete.
 * Mudou aqui, mudou em todas — é o motivo de existir em um lugar só.
 *
 * ⛔ TABELA DE 05/09/2026. A anterior (27/07) ficou no ar por mais de um mês
 * com PREÇO e CORRENTE errados nos 12 modelos: o MB-01 saía R$ 1.200 abaixo
 * da tabela, e de 751 A pra cima o site escolhia modelo MENOR que o
 * necessário — que é vender algo que não protege. Fonte de agora:
 *   • preço e corrente: tabela oficial de venda 2026 (PDF de 31/08), que bate
 *     12/12 com `Produto.precoTabela` no app. "A tabela do app é a que vale"
 *     (Léo, 05/09)
 *   • MB-05 = 551–650 A: o PDF trazia 501, sobrepondo o MB-04. Léo confirmou
 *     551 (05/09)
 *   • ICC: a única spec elétrica que consta nos documentos. `surge`/`nominal`
 *     saíram — ninguém sabia de onde vinham (Léo: "coloque no site só o ICC")
 *   • MB-12 é "+ de 3000 A", SEM teto. O `MB_LOAD_MAX = 6300` era invenção e
 *     fazia o site RECUSAR corrente acima disso — perdia o lead
 *
 * ⚠️ `dim` e `weight` NÃO são spec elétrica e não estão nos PDFs de 2026. Vêm
 * da "folha de dados" citada na versão anterior deste arquivo, sem fonte
 * conferida. Ficam porque `lib/erp/frete.ts` usa os dois pra cotar o Melhor
 * Envio — tirar quebraria o frete. Se a folha de dados aparecer, conferir;
 * se não existir, o frete precisa de outra origem antes de estes saírem.
 *
 * 🔒 Preço de LOCAÇÃO existe no app (`precoLocacaoMensal`) e NÃO entra aqui:
 * o industrial passa pelo representante. Não exibir no site.
 *
 * NÃO inventar valores — só o que veio dos documentos oficiais.
 */

export type MasterBlockModel = {
  model: string;
  /** Faixa de corrente de carga (Ir) do circuito, para exibição. */
  loadLabel: string;
  /** Limite superior da faixa (A) — usado na seleção. MB-12 não tem teto. */
  loadMax: number;
  /** ICC — capacidade de curto-circuito (kA). A spec elétrica oficial. */
  icc: string;
  /** Dimensões C × L × A (mm). Usado pelo frete; ver aviso no cabeçalho. */
  dim: string;
  /** Peso (kg). Usado pelo frete; ver aviso no cabeçalho. */
  weight: string;
  /** Preço de VENDA em R$ (tabela 2026). É o valor que vai pro pedido e pro ERP. */
  preco: number;
};

/** Formata um valor em Reais (sem centavos). */
export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/** Faixa de tensão comum a toda a linha (tabela 2026). */
export const MB_TENSAO = '110 V a 1100 V';

export const MASTER_BLOCK_MODELS: readonly MasterBlockModel[] = [
  { model: 'MB-01', loadLabel: '1 – 150 A', loadMax: 150, icc: '32 kA', dim: '150 × 100 × 60', weight: '1,4', preco: 4350 },
  { model: 'MB-02', loadLabel: '150 – 250 A', loadMax: 250, icc: '40 kA', dim: '150 × 100 × 60', weight: '1,6', preco: 5675 },
  { model: 'MB-03', loadLabel: '251 – 400 A', loadMax: 400, icc: '48 kA', dim: '200 × 100 × 70', weight: '1,8', preco: 6930 },
  { model: 'MB-04', loadLabel: '401 – 550 A', loadMax: 550, icc: '48 kA', dim: '200 × 100 × 70', weight: '2,0', preco: 8290 },
  { model: 'MB-05', loadLabel: '551 – 650 A', loadMax: 650, icc: '56 kA', dim: '200 × 150 × 90', weight: '3,4', preco: 9220 },
  { model: 'MB-06', loadLabel: '651 – 750 A', loadMax: 750, icc: '64 kA', dim: '200 × 150 × 90', weight: '3,7', preco: 11125 },
  { model: 'MB-07', loadLabel: '751 – 850 A', loadMax: 850, icc: '72 kA', dim: '250 × 200 × 100', weight: '5,2', preco: 14625 },
  { model: 'MB-08', loadLabel: '851 – 950 A', loadMax: 950, icc: '80 kA', dim: '250 × 200 × 100', weight: '5,5', preco: 19550 },
  { model: 'MB-09', loadLabel: '951 – 1200 A', loadMax: 1200, icc: '88 kA', dim: '280 × 220 × 100', weight: '8,2', preco: 26900 },
  { model: 'MB-10', loadLabel: '1201 – 2000 A', loadMax: 2000, icc: '96 kA', dim: '280 × 220 × 100', weight: '8,5', preco: 41350 },
  { model: 'MB-11', loadLabel: '2001 – 3000 A', loadMax: 3000, icc: '100 kA', dim: '350 × 260 × 120', weight: '13,5', preco: 65825 },
  // "+ de 3000 A": qualquer corrente acima de 3000 é MB-12. Sem teto.
  { model: 'MB-12', loadLabel: '+ de 3000 A', loadMax: Number.POSITIVE_INFINITY, icc: '100 kA', dim: '350 × 260 × 120', weight: '14,0', preco: 83750 },
] as const;

/**
 * Seleciona o modelo pela corrente de carga do circuito (A).
 * Retorna null só se a corrente for inválida (≤0 ou não numérica). Não existe
 * "acima da linha": o MB-12 atende qualquer valor acima de 3000 A.
 */
export function selecionarMasterBlock(correnteA: number): MasterBlockModel | null {
  if (!Number.isFinite(correnteA) || correnteA <= 0) return null;
  return MASTER_BLOCK_MODELS.find((m) => correnteA <= m.loadMax) ?? null;
}
