// =============================================================================
// PONTO ÚNICO de integração comercial do checkout NI.
//
// A TELA de checkout está pronta e funcional: entrega, resumo do pedido, frete
// e escolha da forma de pagamento. O que falta é só CONECTAR os provedores —
// e tudo que depende deles está isolado aqui.
//
// ⛔ Enquanto `GATEWAY_ATIVO` for false, o pedido é fechado como LEAD no Betinna
// com endereço + forma de pagamento escolhida, e a equipe manda o link de
// pagamento. O cliente não fica sem caminho.
//
// O gateway é o ASAAS, em checkout HOSPEDADO: o servidor cria a cobrança em
// `/api/pedidos` e devolve a página de pagamento, pra onde o checkout redireciona
// (`src/lib/pagamento/asaas.ts`). Dado de cartão não passa pelo nosso servidor.
//
// Falta ligar: Melhor Envio (`calcularFrete()` + FRETE_CALCULADO).
// =============================================================================

/**
 * Gateway ligado? Vem de env pra o mesmo build servir sandbox e produção — e
 * pra a tela nunca prometer pagamento online num ambiente onde a chave não está
 * configurada (promessa que só humano cumpre é pior que a mensagem honesta).
 */
export const GATEWAY_ATIVO = process.env.NEXT_PUBLIC_GATEWAY_ATIVO === 'true';

/** ⛔ Vira true quando o Melhor Envio estiver conectado (prazo real por CEP). */
export const FRETE_CALCULADO = false;

/** Promoção vigente (confirmada pelo Léo em 2026-08-09). */
export const FRETE_GRATIS = true;

/** Só PIX e cartão — decisão do Léo. Boleto ficou de fora do e-commerce. */
export type FormaPagamentoId = 'pix' | 'cartao';

export type FormaPagamento = {
  id: FormaPagamentoId;
  label: string;
  detalhe: string;
};

// ── PARCELAMENTO ─────────────────────────────────────────────────────────────
//
// Até 6x SEM JUROS no cartão (Léo, 09/09/2026). "Sem juros" quer dizer que quem
// paga a diferença é a Somatec: no Asaas, parcelado até 6x custa 2,49% contra
// 1,99% à vista, e o dinheiro entra parcela a parcela em vez de tudo em ~32
// dias. Por isso o cliente ESCOLHE — quem ia pagar à vista de qualquer jeito
// não deve ser empurrado pro parcelado.
//
// O número de parcelas não é decoração de tela: ele vai na criação da cobrança
// (`installmentCount`). Cobrança criada sem ele é à vista, e a página do Asaas
// não oferece parcelar — foi assim que a promessa dos 6x ficou só no texto.

export const MAX_PARCELAS = 6;

/** 6% no PIX à vista. Declarado aqui, e não junto das funções lá embaixo,
 *  porque `FORMAS_PAGAMENTO` usa o número no rótulo — e `const` não é içada. */
export const DESCONTO_PIX_PERCENTUAL = 6;

/**
 * Piso da parcela. Sem ele, um pedido barato vira 6 parcelas de trocado — e
 * cada uma custa os mesmos R$ 0,49 de tarifa, então o parcelamento come a
 * margem inteira do pedido.
 */
export const PARCELA_MINIMA_CENTAVOS = 5_000;

/** Quantas parcelas cabem neste total. Sempre inclui 1 (à vista). */
export function parcelasDisponiveis(totalCentavos: number): number[] {
  const teto = Math.floor(totalCentavos / PARCELA_MINIMA_CENTAVOS);
  const max = Math.min(MAX_PARCELAS, Math.max(1, teto));
  return Array.from({ length: max }, (_, i) => i + 1);
}

/** Valor de cada parcela, em centavos. O Asaas divide igual e ajusta a última. */
export function valorDaParcela(totalCentavos: number, parcelas: number): number {
  const n = Math.max(1, Math.round(parcelas));
  return Math.round(totalCentavos / n);
}

export const FORMAS_PAGAMENTO: readonly FormaPagamento[] = [
  {
    id: 'pix',
    label: 'PIX',
    // O desconto no rótulo sai da CONSTANTE de propósito: escrito à mão, ele
    // seguiria dizendo 6% no dia em que a regra mudasse — e aí a tela promete
    // um número que o servidor não aplica, que é pior que não anunciar.
    detalhe: `${DESCONTO_PIX_PERCENTUAL}% de desconto · aprovação na hora`,
  },
  { id: 'cartao', label: 'Cartão de crédito', detalhe: `Em até ${MAX_PARCELAS}x sem juros` },
];

/**
 * Valor de parcela na tela — COM centavos.
 *
 * O `formatBRL` do catálogo arredonda pro real inteiro, o que está certo pra
 * preço de tabela (são números redondos) e errado pra parcela: R$ 4.350 em 4x
 * dá R$ 1.087,50, e "4x de R$ 1.088" anuncia R$ 4.352 — dois reais que ninguém
 * vai cobrar, num número que o cliente confere na mão.
 */
export function formatParcelaBRL(centavos: number): string {
  return formatBRLCentavos(centavos);
}

/**
 * Mesmo formato, nome honesto: valor em centavos, COM centavos na tela.
 *
 * Passou a ser necessário fora de parcela por causa do desconto do PIX: o
 * `formatBRL` do catálogo arredonda pro real inteiro (certo pra preço de
 * tabela, que é redondo), e 6% de R$ 5.675 dá R$ 5.334,50. Arredondado viraria
 * "R$ 5.335" na tela contra R$ 5.334,50 cobrados — cinquenta centavos que o
 * cliente confere na fatura.
 */
export function formatBRLCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// =============================================================================
// DESCONTO DE 6% NO PIX — decisão do Léo, 23/09/2026.
//
// Três recortes, e cada um foi decidido, não deduzido:
//
//  • **Só PIX.** Cartão em 1x também é à vista, e mesmo assim FICA DE FORA: os
//    6% existem pra compensar a taxa do cartão e o ganho de caixa do PIX. Dar o
//    mesmo desconto no cartão seria pagar pra receber pior.
//  • **Só sobre o PRODUTO.** Frete nunca entra — hoje ele é grátis, e no dia em
//    que deixar de ser, descontar frete seria a Somatec pagando parte do envio.
//  • **Por UNIDADE, não sobre o total.** É o que faz a tela, a cobrança e a
//    nota fecharem no mesmo centavo: o ERP recebe preço unitário (não tem campo
//    de desconto), então o total precisa ser a soma exata dos unitários. Se o
//    desconto fosse aplicado só no total, o ERP faturaria um valor e o cliente
//    pagaria outro — e a diferença só apareceria na conciliação.
// =============================================================================

/**
 * Identifica a forma de pagamento a partir do que veio do navegador — que pode
 * ser o `id` (`"pix"`) ou o `label` (`"PIX"`), porque o checkout manda o label.
 *
 * ⚠️ Devolve `null` pro que não reconhecer, e quem chama trata `null` como SEM
 * desconto. É de propósito: o caminho seguro do erro é cobrar o valor cheio.
 * Um POST sem `formaPagamento` não pode ganhar 6% por omissão.
 */
export function formaPagamentoDe(valor?: string | null): FormaPagamentoId | null {
  const v = (valor ?? '').trim().toLowerCase();
  if (!v) return null;
  const achada = FORMAS_PAGAMENTO.find((f) => f.id === v || f.label.toLowerCase() === v);
  return achada?.id ?? null;
}

/** `true` só pra PIX reconhecido. Ver a nota acima sobre cartão em 1x. */
export function temDescontoPix(formaPagamento?: string | null): boolean {
  return formaPagamentoDe(formaPagamento) === 'pix';
}

/**
 * Preço de UMA unidade com o desconto aplicado, em centavos.
 *
 * Arredonda pro centavo mais próximo. Nos preços de hoje a conta é exata
 * (4.350 → 4.089 · 5.675 → 5.334,50 · 6.930 → 6.514,20), mas o arredondamento
 * fica aqui pra que preço novo não vire fração de centavo em três lugares
 * diferentes com resultados diferentes.
 */
export function comDescontoPix(centavos: number): number {
  return Math.round((centavos * (100 - DESCONTO_PIX_PERCENTUAL)) / 100);
}

/** Tradução pro vocabulário do gateway. Fica aqui porque a lista acima manda. */
export const FORMA_NO_GATEWAY: Record<FormaPagamentoId, 'PIX' | 'CREDIT_CARD'> = {
  pix: 'PIX',
  cartao: 'CREDIT_CARD',
};

export type Endereco = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export const enderecoVazio: Endereco = {
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
};

export function enderecoCompleto(e: Endereco): boolean {
  return Boolean(e.cep && e.logradouro && e.numero && e.bairro && e.cidade && e.uf);
}

export function enderecoEmUmaLinha(e: Endereco): string {
  const compl = e.complemento ? `, ${e.complemento}` : '';
  return `${e.logradouro}, ${e.numero}${compl} — ${e.bairro}, ${e.cidade}/${e.uf} — CEP ${e.cep}`;
}

export type Frete = { valor: number; prazo: string };

/** Frete do pedido. Com a promoção vigente o cliente paga 0; o PRAZO real passa
 *  a vir do Melhor Envio quando FRETE_CALCULADO virar true. */
export function freteDoPedido(): Frete {
  return {
    valor: FRETE_GRATIS ? 0 : NaN,
    prazo: FRETE_CALCULADO ? '' : 'informado na confirmação do pedido',
  };
}
