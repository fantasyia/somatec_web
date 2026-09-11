import 'server-only';
import { getRedis } from '@/lib/redis';
import { createLogger } from '@/lib/logger';

const log = createLogger('ga4-servidor');

// =============================================================================
// MEASUREMENT PROTOCOL DO GA4 — o `purchase` que só o servidor pode contar.
//
// ── O QUE ISSO CONSERTA (auditoria do Google, 11/09) ────────────────────────
//
// O site dispara `pedido_registrado` com `items`, `currency` e `value`, e o
// valor CHEGA no GA4: `eventValue` acumulou R$ 17.800 em 30 dias. Mas o painel
// mostra `purchaseRevenue = 0` e o público padrão "Purchasers" está vazio.
//
// Não é bug nosso: o GA4 só alimenta os relatórios de e-commerce e os públicos
// padrão com eventos de NOME PADRÃO da especificação — `purchase`,
// `add_to_cart`, `begin_checkout`. `pedido_registrado` é custom: os parâmetros
// chegam e ficam consultáveis, e nenhum relatório de receita os vê.
// (`begin_checkout`, que usa nome padrão, alimenta normal.)
//
// ── POR QUE AQUI E NÃO NO NAVEGADOR ─────────────────────────────────────────
//
// `pedido_registrado` é "o cliente enviou o pedido". `purchase` tem que ser "o
// dinheiro entrou" — senão a receita do GA4 passa a contar pedido não pago, e
// o algoritmo aprende a caçar quem registra e some.
//
// E o dinheiro entra quando o Asaas avisa, num webhook: não há navegador
// aberto pra disparar nada. O checkout é HOSPEDADO — o cliente sai do site pra
// pagar e pode nunca voltar (PIX confirma minutos depois, em outro app). O
// único caminho é o servidor mandar direto pro GA4, que é o que isto faz.
//
// ⚠️ INERTE SEM CREDENCIAL — mesmo desenho do CAPI da Meta. Faltando
// `GA4_MEASUREMENT_ID` ou `GA4_API_SECRET`, nada sai e nada quebra. As duas são
// variáveis do Railway; o segredo se cria no painel do GA4 em
// Admin → Fluxos de dados → o fluxo do site → Measurement Protocol API secrets.
//
// ⚠️ O MEASUREMENT PROTOCOL FALHA CALADO. Ele responde 204 para requisição
// aceita E para evento inválido — nome errado, parâmetro fora do formato,
// segredo de outro fluxo. Por isso existe `GA4_MP_DEBUG`: liga o endpoint de
// validação do Google, que devolve o motivo em texto, e a gente registra no
// log. Ligar na primeira verificação e desligar depois.
// =============================================================================

const URL_PADRAO = 'https://www.google-analytics.com/mp/collect';
const URL_DEBUG = 'https://www.google-analytics.com/debug/mp/collect';
const TIMEOUT_MS = 4000;
/** O pagamento pode demorar (PIX fora do horário, cartão em análise). */
const TTL_CID_SEGUNDOS = 30 * 24 * 60 * 60;

export type ItemGa4 = {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
};

function config(): { id: string; secret: string } | null {
  const id = (process.env.GA4_MEASUREMENT_ID ?? '').trim();
  const secret = (process.env.GA4_API_SECRET ?? '').trim();
  if (!id || !secret) return null;
  return { id, secret };
}

/**
 * `client_id` do GA4 a partir do cookie `_ga` — `GA1.1.<a>.<b>` vira `<a>.<b>`.
 *
 * É o que liga o `purchase` do servidor à PESSOA que navegou. Sem ele, o GA4
 * cria um usuário novo do nada: a receita aparece, mas atribuída a ninguém — e
 * o público "Purchasers", que existe pra remarketing, enche de fantasma em vez
 * de encher de quem comprou.
 */
export function clientIdDoCookieGa(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const p = valor.split('.');
  // `GA1.1.123.456` (4 partes) é o formato de domínio raiz; alguns ambientes
  // trazem um nível a mais. Os DOIS ÚLTIMOS campos são sempre o id.
  if (p.length < 4) return null;
  const cid = p.slice(-2).join('.');
  return /^\d+\.\d+$/.test(cid) ? cid : null;
}

/**
 * `session_id` a partir do cookie `_ga_<FLUXO>`. Melhor esforço: sem ele o GA4
 * abre uma sessão nova pro evento, o que não perde a receita mas separa o
 * `purchase` da sessão em que a pessoa navegou.
 *
 * Dois formatos convivem em campo, e a diferença não é documentada:
 *   GS1.1.<sessao>.<n>.<engajada>.…
 *   GS2.1.s<sessao>$o1$g0$t…$j0$l0$h0
 */
export function sessionIdDoCookieGa(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const gs2 = valor.match(/\bs(\d{8,})\b/);
  if (gs2) return gs2[1];
  const p = valor.split('.');
  return p.length >= 3 && /^\d{8,}$/.test(p[2]) ? p[2] : null;
}

/** Nome do cookie de sessão do fluxo: `G-J12FLMK7S6` → `_ga_J12FLMK7S6`. */
export function cookieDeSessaoGa4(measurementId: string): string {
  return `_ga_${measurementId.replace(/^G-/, '')}`;
}

const chaveCid = (numeroPedido: string) => `somatec:ga4:cid:${numeroPedido}`;

/**
 * Guarda quem navegou, pra quando o dinheiro entrar.
 *
 * Redis e não coluna no banco de propósito: isto é metadado de marketing com
 * validade, não dado do pedido. Uma coluna nova pediria migração e mudança na
 * assinatura da função `criar_pedido` (SECURITY DEFINER) — muito estrago pra
 * guardar um par de números que expira em 30 dias.
 *
 * Sem Redis, o `purchase` ainda sai: perde a ligação com a pessoa, não a venda.
 */
export async function guardarIdentidadeGa4(
  numeroPedido: string,
  identidade: { clientId: string | null; sessionId: string | null },
): Promise<void> {
  if (!identidade.clientId) return;
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(
      chaveCid(numeroPedido),
      JSON.stringify(identidade),
      'EX',
      TTL_CID_SEGUNDOS,
    );
  } catch (err) {
    // Falhar aqui não pode atrapalhar o pedido — o pior caso é o `purchase`
    // sair sem atribuição de usuário.
    log.warn('nao guardei o client_id do GA4', { pedido: numeroPedido, erro: String(err) });
  }
}

export async function lerIdentidadeGa4(
  numeroPedido: string,
): Promise<{ clientId: string | null; sessionId: string | null }> {
  const vazio = { clientId: null, sessionId: null };
  const redis = getRedis();
  if (!redis) return vazio;
  try {
    const cru = await redis.get(chaveCid(numeroPedido));
    if (!cru) return vazio;
    const d = JSON.parse(cru) as { clientId?: string | null; sessionId?: string | null };
    return { clientId: d.clientId ?? null, sessionId: d.sessionId ?? null };
  } catch {
    return vazio;
  }
}

/**
 * `client_id` de reserva quando não sabemos quem navegou (Redis fora, ou
 * pagamento de um pedido criado antes desta mudança).
 *
 * A escolha aqui é entre duas perdas, e elas não têm o mesmo tamanho:
 *
 *   • não mandar        → a venda não existe no relatório de receita. O
 *                         problema que este arquivo veio resolver volta.
 *   • mandar sem pessoa → a receita fica certa; o "Purchasers" ganha um
 *                         usuário que não navegou.
 *
 * Manda. Dinheiro que entrou tem que aparecer. E vai marcado com
 * `cid_origem: 'pedido'`, pra dar pra separar no relatório o que tem gente
 * atrás do que não tem — sem isso, a mistura seria invisível.
 *
 * Determinístico a partir do número: reentrega do mesmo pedido cai no mesmo
 * id, em vez de inventar um usuário novo a cada tentativa.
 */
export function clientIdSintetico(numeroPedido: string): string {
  let h = 0;
  for (const c of numeroPedido) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  // O GA4 aceita qualquer string; o formato `<n>.<n>` é o do cookie, e manter
  // a forma evita que alguém olhe o relatório e ache que é lixo.
  return `${h}.0`;
}

/**
 * Manda o `purchase` pro GA4. Nunca lança — quem chama está dentro de um
 * webhook que precisa devolver 200.
 */
export async function enviarPurchaseGa4(params: {
  numeroPedido: string;
  valorCentavos: number;
  items: ItemGa4[];
}): Promise<{ enviado: boolean; motivo?: string }> {
  const cfg = config();
  if (!cfg) return { enviado: false, motivo: 'sem-config' };

  const identidade = await lerIdentidadeGa4(params.numeroPedido);
  const sintetico = !identidade.clientId;
  const clientId = identidade.clientId ?? clientIdSintetico(params.numeroPedido);

  const corpo = {
    client_id: clientId,
    events: [
      {
        name: 'purchase',
        params: {
          // ⚠️ É o MESMO número do `pedido_registrado` do navegador. O GA4
          // deduplica compra por `transaction_id`: divergir aqui faria a mesma
          // venda contar duas vezes quando o gateway reentrega.
          transaction_id: params.numeroPedido,
          value: params.valorCentavos / 100,
          currency: 'BRL',
          items: params.items,
          // Sem isto o GA4 registra o evento e não conta sessão — e o
          // "Purchasers" só enche com evento dentro de sessão.
          engagement_time_msec: 1,
          cid_origem: sintetico ? 'pedido' : 'ga',
          ...(identidade.sessionId ? { session_id: identidade.sessionId } : {}),
        },
      },
    ],
  };

  const debug = process.env.GA4_MP_DEBUG === 'true';
  const url = `${debug ? URL_DEBUG : URL_PADRAO}?measurement_id=${encodeURIComponent(
    cfg.id,
  )}&api_secret=${encodeURIComponent(cfg.secret)}`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (debug) {
      // O endpoint de validação devolve `validationMessages`. Lista vazia =
      // o evento passou. É a ÚNICA forma de saber: o endpoint normal responde
      // 204 tanto pra evento bom quanto pra evento recusado.
      const texto = await r.text();
      log.info('GA4 debug', { pedido: params.numeroPedido, resposta: texto.slice(0, 500) });
    }

    if (!r.ok) {
      log.warn('GA4 recusou o purchase', { pedido: params.numeroPedido, status: r.status });
      return { enviado: false, motivo: `HTTP ${r.status}` };
    }
    log.info('purchase enviado ao GA4', {
      pedido: params.numeroPedido,
      valorCentavos: params.valorCentavos,
      cidOrigem: sintetico ? 'pedido' : 'ga',
    });
    return { enviado: true };
  } catch (err) {
    // Rede fora ou timeout. `warn`, não `error`: o dinheiro entrou, o cliente
    // foi avisado e o ERP recebeu — o que se perde é uma linha de relatório.
    log.warn('falha mandando purchase ao GA4', {
      pedido: params.numeroPedido,
      erro: String(err),
    });
    return { enviado: false, motivo: 'erro' };
  }
}
