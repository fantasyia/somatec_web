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
// Pra ligar de verdade (card "🔌 Integrações & Dados" → checklist do e-commerce):
//   1. gateway: implementar `criarPagamento()` e virar GATEWAY_ATIVO
//   2. Melhor Envio: implementar `calcularFrete()` e virar FRETE_CALCULADO
// Nenhum outro arquivo do site fala com esses provedores.
// =============================================================================

/** ⛔ Vira true quando o gateway estiver conectado. */
export const GATEWAY_ATIVO = false;

/** ⛔ Vira true quando o Melhor Envio estiver conectado (prazo real por CEP). */
export const FRETE_CALCULADO = false;

/** Promoção vigente (confirmada pelo Léo em 2026-08-09). */
export const FRETE_GRATIS = true;

export type FormaPagamentoId = 'pix' | 'cartao' | 'boleto';

export type FormaPagamento = {
  id: FormaPagamentoId;
  label: string;
  detalhe: string;
};

export const FORMAS_PAGAMENTO: readonly FormaPagamento[] = [
  { id: 'pix', label: 'PIX', detalhe: 'Aprovação na hora' },
  { id: 'cartao', label: 'Cartão de crédito', detalhe: 'Parcelamento conforme a bandeira' },
  { id: 'boleto', label: 'Boleto bancário', detalhe: 'Compensa em até 3 dias úteis' },
];

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
