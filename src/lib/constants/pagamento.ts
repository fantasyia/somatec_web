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

export const FORMAS_PAGAMENTO: readonly FormaPagamento[] = [
  { id: 'pix', label: 'PIX', detalhe: 'Aprovação na hora' },
  { id: 'cartao', label: 'Cartão de crédito', detalhe: 'Parcelamento conforme a bandeira' },
];

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
