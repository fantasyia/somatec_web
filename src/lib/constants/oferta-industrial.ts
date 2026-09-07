// =============================================================================
// A OFERTA INDUSTRIAL, EM UM LUGAR SÓ.
//
// Existe porque a oferta estava COPIADA E COLADA em várias páginas. Quando o
// modelo mudou em 03/09, o site continuou prometendo por escrito uma coisa que
// a empresa não fazia mais, e achar todas as cópias virou varredura por regex.
//
// Daqui pra frente: mudou a oferta, muda AQUI. Se um texto novo precisar de
// uma variação, ela nasce neste arquivo, não solta na página.
//
// -----------------------------------------------------------------------------
// O MODELO ATUAL (refinado pelo Léo em 04/09/2026)
//
//   1. o cliente assina o contrato de locação
//   2. a Somatec emite a nota fiscal
//   3. a cobrança só começa 45 dias depois da emissão da NF — o prazo existe
//      de propósito: dá tempo de entregar, instalar, e o cliente já estar
//      recebendo as primeiras análises da rede dele
//   4. a instalação é contratada pelo PRÓPRIO CLIENTE, paga direto a uma
//      empresa homologada pela Somatec
//   5. 🔒 no 12º mês abre uma janela de saída de 60 dias — ISSO É DADO INTERNO
//      DESDE 07/09, não vai no site (ver abaixo)
//
// O que o site DIZ da oferta: locação; estudo, projeto e proposta sem custo;
// cobrança só 45 dias depois da NF; instalação contratada pelo cliente com
// empresa homologada. Só isso.
//
// -----------------------------------------------------------------------------
// 🔒 O QUE NÃO PODE APARECER NO SITE
//
//   • A duração do contrato é dado INTERNO. Em lugar nenhum.
//   • A JANELA DE SAÍDA (12º mês, 60 dias) — decisão do Léo em 07/09/2026:
//     "isso não deve ser usado como propaganda de marketing, a gente não quer
//     que o cliente saia da nossa locação, não precisa ser explícito de dizer
//     isso pra ele". A janela continua existindo no CONTRATO; o que acabou foi
//     usá-la como argumento. Entre 04/09 e 07/09 ela foi o argumento central
//     ("No 12º mês, você decide se continua" era H2 na home) — se alguém
//     achar essa frase em cache, doc ou card, é desta fase, e não volta.
//   • A instalação NÃO é sem custo: quem contrata e paga é o cliente, com uma
//     empresa homologada. Dizer o contrário inverte quem paga uma conta.
//
// ⚠️ Vale só pro INDUSTRIAL. O não-industrial é compra direta: paga, o
// equipamento é dele, sem contrato e sem mensalidade.
//
// ⛔ Vocabulário aposentado, que não volta:
//   03/09 — "período de avaliação", "60 a 90 dias", "só paga se o resultado
//           for comprovado", "as cinco etapas sem custo", "zero risco"
//   04/09 — "não paga nada até a instalação", "instalação sem custo",
//           "encerra/cancela quando quiser"
//
// O teste `tests/oferta-industrial.test.ts` reprova o build se qualquer um
// reaparecer em `src/`.
//
// ⚠️ `sem custo` sozinho NÃO é proibido: continua certo em "estudo, projeto e
// proposta sem custo". ⛔ Mas "retira(mos) sem custo" / "se não valer a pena, a
// gente retira" é a janela de saída sem o nome — caiu junto com ela em 07/09.
// =============================================================================

export const OFERTA_INDUSTRIAL = {
  /** Uma linha. Barra sticky, cartão lateral, espaços apertados. */
  curta: 'A cobrança só começa 45 dias depois da nota fiscal.',

  /** Parágrafo dos CTAs de fim de página. */
  paragrafo:
    'Na indústria o Master Block trabalha por locação: estudo da rede, projeto e proposta correm sem custo. Fechado o contrato, a Somatec emite a nota fiscal e a cobrança só começa 45 dias depois da emissão — tempo de entregar, instalar e você já estar recebendo as primeiras análises da sua rede. A instalação você contrata, com uma das empresas homologadas pela Somatec.',

  /** Mesma coisa, aberta com o convite a falar com a engenharia. */
  paragrafoEngenharia:
    'Fale com a engenharia da Somatec Blocking. Na indústria o Master Block trabalha por locação: estudo da rede, projeto e proposta correm sem custo. Fechado o contrato, a Somatec emite a nota fiscal e a cobrança só começa 45 dias depois da emissão — tempo de entregar, instalar e você já estar recebendo as primeiras análises da sua rede. A instalação você contrata, com uma das empresas homologadas pela Somatec.',

  /** Rótulo curto do bloco lateral do blog. */
  lateralTitulo: 'Locação para a indústria',
} as const;

// =============================================================================
// GARANTIA — texto de 03/09. O antigo dizia "3 anos (+1 com depoimento)",
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
