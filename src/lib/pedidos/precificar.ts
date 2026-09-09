import { MASTER_BLOCK_MODELS } from '@/lib/constants/masterblock';
import { freteDoPedido } from '@/lib/constants/pagamento';

// =============================================================================
// Preço do pedido — resolvido no SERVIDOR.
//
// O que chega do navegador é INTENÇÃO DE COMPRA (qual modelo, quantas
// unidades). Preço, nunca: `precoCentavos` e `totalCentavos` do corpo eram
// aceitos como verdade, e enquanto não havia pagamento online isso só sujava o
// registro — alguém cobrava o valor certo na mão. Ligado o gateway, esse mesmo
// número passou a definir QUANTO O CLIENTE PAGA: um POST com
// `totalCentavos: 100` gerava cobrança de R$ 1,00 por um equipamento de
// R$ 4.350,00, e o pedido nascia marcado como pago. Não exige nada sofisticado
// — o DevTools aberto no checkout já basta.
// =============================================================================

export type ItemPedidoEntrada = {
  descricao: string;
  modelo?: string | null;
  quantidade?: number;
  /** O que o navegador AFIRMA que é o preço. Usado só pra comparar. */
  precoCentavos?: number;
};

export type ItemPrecificado = {
  descricao: string;
  modelo: string | null;
  quantidade: number;
  precoCentavos: number;
};

export type ResultadoPreco =
  | {
      ok: true;
      itens: ItemPrecificado[];
      /** Soma dos itens + frete, tudo calculado aqui. */
      totalCentavos: number;
      freteCentavos: number;
      /** Diferença (em centavos) entre o que o cliente afirmou e o real. */
      divergenciaCentavos: number;
    }
  | { ok: false; motivo: string; detalhe?: string };

/** Catálogo indexado por modelo, em CENTAVOS (a tabela é em reais). */
const PRECO_POR_MODELO = new Map<string, number>(
  MASTER_BLOCK_MODELS.map((m) => [m.model.toUpperCase(), Math.round(m.preco * 100)] as const),
);

/**
 * SKU de TESTE do ERP — produto fictício de R$ 10,00 ("TESTE-NF", não vender).
 *
 * Existe pra homologar a nota fiscal: a NF de teste precisa sair barata, e o
 * único produto do ERP com NCM cadastrado é este. Emitir NF de homologação num
 * pedido de R$ 4.350 seria pôr o valor cheio pra circular à toa.
 *
 * ⚠️ **Fora do catálogo do site de propósito.** Ele não aparece em página, nem
 * no wizard, nem na tabela de modelos — só é aceito quando a requisição prova
 * que é da operação (ver `permitirTeste`). Sem isso, seria a brecha de preço
 * reaberta com outro nome.
 */
export const SKU_TESTE = 'TESTE-NF';
const PRECO_TESTE_CENTAVOS = 1_000;

/** Preço de tabela de um modelo, ou `null` se ele não existe. */
export function precoDoModelo(modelo?: string | null, permitirTeste = false): number | null {
  const chave = (modelo ?? '').trim().toUpperCase();
  if (!chave) return null;
  if (chave === SKU_TESTE) return permitirTeste ? PRECO_TESTE_CENTAVOS : null;
  return PRECO_POR_MODELO.get(chave) ?? null;
}

/**
 * Recalcula o pedido inteiro a partir do catálogo.
 *
 * Regras, e cada uma existe por um motivo diferente:
 *
 * - **Item com modelo desconhecido é recusado.** Aceitar "MB-99" pelo preço que
 *   o cliente mandou é a mesma brecha por outra porta.
 * - **Item sem modelo vale zero** e não impede o pedido: o carrinho aceita
 *   linha de contexto (o quadro que a pessoa descreveu) que não é produto.
 * - **Frete vem da regra do servidor**, não do corpo. Hoje é grátis; no dia em
 *   que deixar de ser, o cliente não escolhe o próprio frete.
 * - **Quantidade tem teto** (`MAX_QTD`): sem ele, `quantidade: 999999` estoura
 *   o valor da cobrança e vira outro tipo de problema.
 */
const MAX_QTD = 50;

export function precificarPedido(
  itens: ItemPedidoEntrada[],
  afirmadoPeloCliente?: { totalCentavos?: number; freteCentavos?: number },
  /** Libera o SKU de teste. Só a rota decide, e só com o segredo da operação. */
  permitirTeste = false,
): ResultadoPreco {
  const precificados: ItemPrecificado[] = [];

  for (const item of itens) {
    const modelo = (item.modelo ?? '').trim() || null;
    const quantidade = Math.min(Math.max(Math.round(item.quantidade ?? 1), 1), MAX_QTD);

    if (!modelo) {
      // Linha sem produto: entra no registro pelo texto, com valor zero.
      precificados.push({ descricao: item.descricao, modelo: null, quantidade, precoCentavos: 0 });
      continue;
    }

    const preco = precoDoModelo(modelo, permitirTeste);
    if (preco === null) {
      return {
        ok: false,
        motivo: 'modelo_desconhecido',
        detalhe: `O modelo ${modelo} não existe no catálogo.`,
      };
    }
    precificados.push({ descricao: item.descricao, modelo, quantidade, precoCentavos: preco });
  }

  const itensCentavos = precificados.reduce((s, i) => s + i.precoCentavos * i.quantidade, 0);
  const frete = freteDoPedido();
  const freteCentavos = Number.isFinite(frete.valor) ? Math.round(frete.valor * 100) : 0;
  const totalCentavos = itensCentavos + freteCentavos;

  const afirmado = Math.round(afirmadoPeloCliente?.totalCentavos ?? totalCentavos);
  return {
    ok: true,
    itens: precificados,
    totalCentavos,
    freteCentavos,
    divergenciaCentavos: totalCentavos - afirmado,
  };
}
