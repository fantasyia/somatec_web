// =============================================================================
// EVENTOS DE FUNIL — a taxonomia que o Google Ads e a Meta consomem.
//
// Definida pela sessão de Ads em 08/09; o site é quem EMITE, o GTM é quem
// distribui. Por isso tudo sai por `trackEvent` (que empurra pro dataLayer
// quando há container) e nada aqui fala com GA4 ou Pixel diretamente.
//
// ⚠️ `purchase` NÃO existe neste arquivo, de propósito. Enquanto
// `GATEWAY_ATIVO` for false o checkout fecha como LEAD, não cobra. Disparar
// `purchase` aí ensinaria Google e Meta a caçar quem REGISTRA pedido e não
// paga — e esse aprendizado não se apaga: o algoritmo carrega o viés depois de
// corrigido. Por isso o evento do pedido é `pedido_registrado`, custom, e a
// sessão de Ads não vai marcá-lo como conversão em plataforma nenhuma. Vira
// `purchase` de verdade quando o Asaas confirmar pagamento, server-side.
// =============================================================================

import { trackEvent } from '@/lib/analytics';
import { getAtribuicao } from '@/lib/attribution';

/**
 * Qual motor de venda gerou o evento. São negócios diferentes — funil, público
 * e ticket — e a sessão de Ads segmenta campanha por este campo.
 *
 * ⚠️ `representante` NÃO é motor de venda: é recrutamento, vai pro funil de
 * prospecção de reps e terá campanha própria. Misturar com `industrial`
 * colocaria candidato a rep e cliente industrial no mesmo público.
 *
 * ⚠️ `indefinido` é resposta legítima, não preguiça. O seletor serve aos dois
 * públicos e o caminho não revela qual é. Chutar aqui treina a campanha no
 * público errado — e isso queima dinheiro de verdade. Balde de "não sei" se
 * resolve depois, pelo funil; dado errado que parece certo, não.
 */
export type Motor = 'industrial' | 'nao_industrial' | 'representante' | 'indefinido';

/** De onde veio o lead. Fecha com a taxonomia da sessão de Ads. */
export type FormId =
  | 'contato'
  | 'representante'
  | 'calculadora_industrial'
  | 'custo_parada'
  /** Seletor autônomo "qual Master Block é o meu" — exploratório. */
  | 'seletor'
  /**
   * Tentou comprar e o wizard não fechou preço. ⚠️ NÃO é `seletor`: quem chega
   * aqui está muito mais quente que quem foi só explorar qual modelo serve.
   * Juntar os dois na mesma linha do relatório cegaria o follow-up.
   */
  | 'checkout_sem_preco';

export type ItemEvento = {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
};

/**
 * Eventos de e-commerce vão no bloco `ecommerce`, com `items` como ARRAY —
 * não como string.
 *
 * A tag do GA4 no GTM lê `ecommerce` NATIVAMENTE ("Enviar dados de e-commerce"
 * → origem "Camada de dados") e espera array. Chegando string, os relatórios de
 * item do GA4 ficam vazios — e some justamente a visão de QUAL modelo converte,
 * que é o que decide em qual produto anunciar. (Eu tinha proposto string por
 * medo de objeto aninhado se perder em variável do GTM; vale pro caso genérico,
 * mas `ecommerce` é o caso especial com tratamento próprio. Veto da sessão de
 * Ads, 08/09, e é veto certo.)
 *
 * O `ecommerce: null` antes de cada push é prática documentada do Google: sem
 * ele, os `items` de um evento VAZAM pro evento seguinte.
 */
function emitirEcommerce(
  nome: string,
  ecommerce: { currency: 'BRL'; value: number; items: ItemEvento[] },
  extras: Comuns,
): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.__somatecGTM) {
      window.dataLayer?.push({ ecommerce: null });
      window.dataLayer?.push({ event: nome, ecommerce, ...extras });
    } else {
      // Sem container, o gtag recebe os campos no nível do evento — é o formato
      // que o GA4 espera quando não há GTM no meio.
      window.gtag?.('event', nome, { ...ecommerce, ...extras });
    }
  } catch {
    // analytics nunca pode quebrar a UI
  }
}

/**
 * ID único DO EVENTO — é o que faz o dedupe entre o disparo do navegador e o
 * do servidor (CAPI). Um por evento, nunca por sessão ou por usuário:
 * `begin_checkout` e o `purchase` do mesmo pedido têm ids diferentes.
 *
 * Gerado no CLIENTE de propósito. Se o servidor gerasse e devolvesse, o Pixel
 * teria que esperar a resposta pra disparar — e quem fecha a aba nesse intervalo
 * sumiria da medição.
 */
export function novoEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Navegador antigo ou contexto sem crypto: pseudo-UUID serve, porque o valor
  // só precisa ser único entre browser e servidor — não é segredo.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Campanha do PRIMEIRO toque — é o que amarra o evento à campanha no relatório. */
function campanha(): string | undefined {
  return getAtribuicao()?.primeiro?.utmCampaign;
}

type Comuns = { motor: Motor; event_id: string; utm_campaign?: string; transaction_id?: string };

function comuns(motor: Motor, eventId: string): Comuns {
  const c = campanha();
  return { motor, event_id: eventId, ...(c ? { utm_campaign: c } : {}) };
}

/**
 * Lead entregue — vale pros quatro formulários. É a conversão principal
 * enquanto o gateway não cobra.
 *
 * Devolve o `event_id` pra quem chamou mandar no payload: o servidor reusa o
 * MESMO valor no CAPI, e é assim que os dois disparos viram um evento só.
 */
export function rastrearLead(args: { formId: FormId; motor: Motor; eventId?: string }): string {
  const eventId = args.eventId ?? novoEventId();
  trackEvent('generate_lead', { form_id: args.formId, ...comuns(args.motor, eventId) });
  return eventId;
}

/** Início do checkout não-industrial. */
export function rastrearInicioCheckout(args: {
  value: number;
  items: ItemEvento[];
  eventId?: string;
}): string {
  const eventId = args.eventId ?? novoEventId();
  emitirEcommerce(
    'begin_checkout',
    { currency: 'BRL', value: args.value, items: args.items },
    comuns('nao_industrial', eventId),
  );
  return eventId;
}

/**
 * Pedido `SB…` criado. ⛔ NÃO é conversão — ver o cabeçalho deste arquivo.
 * O nome é custom justamente pra não ser confundido com `purchase` por engano
 * na hora de montar a conversão no painel.
 */
export function rastrearPedidoRegistrado(args: {
  transactionId: string;
  value: number;
  items: ItemEvento[];
  eventId?: string;
}): string {
  const eventId = args.eventId ?? novoEventId();
  emitirEcommerce(
    'pedido_registrado',
    { currency: 'BRL', value: args.value, items: args.items },
    { ...comuns('nao_industrial', eventId), transaction_id: args.transactionId },
  );
  return eventId;
}
