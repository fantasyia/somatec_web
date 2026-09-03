// =============================================================================
// A OFERTA INDUSTRIAL, EM UM LUGAR SÓ.
//
// Existe porque a oferta anterior ("período de avaliação de 60 a 90 dias, você
// só paga se o resultado for comprovado") estava COPIADA E COLADA em seis
// páginas. Quando o Léo mudou o modelo em 03/09, o site continuou prometendo
// por escrito uma coisa que a empresa não faz mais — e achar todas as cópias
// virou varredura por regex.
//
// Daqui pra frente: mudou a oferta, muda AQUI. Se um texto novo precisar de
// uma variação, ela nasce neste arquivo, não solta na página.
//
// -----------------------------------------------------------------------------
// O MODELO ATUAL (decidido pelo Léo em 03/09/2026)
//
//   1. o cliente assina o contrato de locação
//   2. é instalado — até a instalação não paga nada
//   3. a primeira mensalidade vence 30 dias depois
//   4. a partir de 12 meses, se não estiver satisfeito ou não quiser mais, a
//      Somatec retira o equipamento sem custo e encerra o contrato
//
// O argumento NÃO é mais "não paga até provar". É DIREITO DE SAÍDA: pode sair
// sem multa, e a retirada é sem custo.
//
// -----------------------------------------------------------------------------
// 🔒 DUAS COISAS QUE NÃO PODEM APARECER NO SITE
//
//   • A duração do contrato é dado INTERNO. Em lugar nenhum.
//   • Os 12 meses são o prazo pra ENCERRAR SEM CUSTO — nunca a duração do
//     contrato. Escrever "contrato de 12 meses" é errado e é o escorregão mais
//     fácil de cometer aqui.
//
// ⚠️ Vale só pro INDUSTRIAL. O não-industrial é compra direta: paga, o
// equipamento é dele, sem contrato e sem mensalidade.
//
// ⛔ Vocabulário aposentado, que não volta: "período de avaliação", "60 a 90
// dias", "só paga se o resultado for comprovado", "as cinco etapas sem custo",
// "zero risco". O teste `tests/oferta-industrial.test.ts` reprova o build se
// qualquer um reaparecer em `src/`.
// =============================================================================

export const OFERTA_INDUSTRIAL = {
  /** Uma linha. Barra sticky, cartão lateral, espaços apertados. */
  curta: 'Até a instalação você não paga nada. Depois de 12 meses, pode encerrar sem custo.',

  /** Parágrafo dos CTAs de fim de página. */
  paragrafo:
    'Na indústria o Master Block trabalha por locação: você assina o contrato e a gente instala — até a instalação, você não paga nada. A primeira mensalidade vence 30 dias depois, e a partir de 12 meses, se não quiser mais, a Somatec retira o equipamento sem custo.',

  /** Mesma coisa, aberta com o convite a falar com a engenharia. */
  paragrafoEngenharia:
    'Fale com a engenharia da Somatec Blocking. Na indústria o Master Block trabalha por locação: você assina o contrato e a gente instala — até a instalação, você não paga nada. A primeira mensalidade vence 30 dias depois, e a partir de 12 meses, se não quiser mais, a Somatec retira o equipamento sem custo.',

  /** Rótulo curto do bloco lateral do blog. */
  lateralTitulo: 'Locação com direito de saída',
} as const;

// =============================================================================
// GARANTIA — texto novo de 03/09. O antigo dizia "3 anos (+1 com depoimento)",
// que era o registro aposentado nesse mesmo dia.
// =============================================================================

export const GARANTIA = {
  /** Compra direta (residencial/comercial). */
  ni: '12 meses no total: 3 meses de garantia legal + 9 meses da Somatec Blocking. Acionada dentro do prazo, a reposição sai em até 3 dias.',

  /** Versão curta pro selo do checkout. */
  niCurta: '3 meses de garantia legal + 9 meses da Somatec. Reposição em até 3 dias.',

  /** Locação industrial — a garantia já está no valor da mensalidade. */
  industrial:
    'Na locação, a garantia é a reposição do equipamento em até 3 dias no seu endereço, sem custo — já coberta pelo valor da mensalidade.',
} as const;
