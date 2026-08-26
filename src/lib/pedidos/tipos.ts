// =============================================================================
// Pedido da compra direta (linha não-industrial).
//
// O número do pedido é a ÚNICA coisa que o cliente precisa pra consultar — e
// por isso ele é, na prática, uma senha. Ver `src/lib/pedidos/servidor.ts`
// para o que isso implica em o que a consulta devolve.
// =============================================================================

export const STATUS_PEDIDO = [
  'recebido',
  'em_separacao',
  'enviado',
  'entregue',
  'cancelado',
] as const;

export type StatusPedido = (typeof STATUS_PEDIDO)[number];

/** O que o cliente lê na tela. Texto de gente, não de sistema. */
export const ROTULO_STATUS: Record<StatusPedido, { titulo: string; explica: string }> = {
  recebido: {
    titulo: 'Pedido recebido',
    explica: 'Recebemos seu pedido e nossa equipe está confirmando os dados com você.',
  },
  em_separacao: {
    titulo: 'Em separação',
    explica: 'Seu Master Block está sendo separado e embalado para envio.',
  },
  enviado: {
    titulo: 'A caminho',
    explica: 'Saiu para entrega. Use o código de rastreio para acompanhar.',
  },
  entregue: {
    titulo: 'Entregue',
    explica: 'A entrega foi concluída. Qualquer coisa, fale com a gente pelo WhatsApp.',
  },
  cancelado: {
    titulo: 'Cancelado',
    explica: 'Este pedido foi cancelado. Se não foi você, fale com a gente.',
  },
};

/** A ordem em que os passos acontecem — usada pra desenhar a régua na tela.
 *  `cancelado` fica fora: não é um passo, é uma saída. */
export const PASSOS_DO_PEDIDO: StatusPedido[] = [
  'recebido',
  'em_separacao',
  'enviado',
  'entregue',
];

export type ItemPedido = {
  descricao: string;
  modelo?: string | null;
  quantidade: number;
  precoCentavos: number;
};

export type EventoHistorico = {
  status: StatusPedido;
  em: string;
  nota?: string | null;
};

/** O que a consulta devolve — de propósito, MENOS do que a tabela guarda. */
export type PedidoPublico = {
  numero: string;
  status: StatusPedido;
  criadoEm: string;
  atualizadoEm: string;
  itens: ItemPedido[];
  totalCentavos: number;
  freteCentavos: number;
  formaPagamento: string | null;
  transportadora: string | null;
  rastreioCodigo: string | null;
  rastreioUrl: string | null;
  historico: EventoHistorico[];
  primeiroNome: string | null;
  cidade: string | null;
  uf: string | null;
};

/** SB2608K7M2QX — SÓ letra e número, sem hífen nem separador.
 *
 *  Decisão do Léo (26/08): o número é ditado e digitado por gente, muitas
 *  vezes no WhatsApp. Hífen é caractere que se erra, se troca por traço
 *  longo, some no copiar-colar e ainda vira dúvida ("tem traço mesmo?").
 *
 *  O alfabeto também exclui I, L, O, U, 0 e 1 — os que se confundem entre si
 *  ao ditar ou ao ler de uma nota. */
export const PADRAO_NUMERO = /^SB\d{4}[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

/** Aceita o que o cliente digita de verdade: minúsculo, com espaço, com hífen
 *  (porque alguém vai colocar), colado do e-mail com espaço no fim. Tudo que
 *  não é letra ou número simplesmente sai. */
export function normalizarNumero(bruto: string): string {
  return String(bruto || '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

export function numeroValido(bruto: string): boolean {
  return PADRAO_NUMERO.test(normalizarNumero(bruto));
}

export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
