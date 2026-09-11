// =============================================================================
// TRÁFEGO INTERNO — marcar a visita do Léo na ORIGEM, não por inferência.
//
// O PROBLEMA QUE ISSO RESOLVE (auditoria do Google, 11/09, sessão de Ads):
// nos 30 dias anteriores, 100% das conversões do GA4 — `generate_lead` ×5 e
// `pedido_registrado` ×5 — vieram de `teste_leo / cpc`. Com a importação pro
// Google Ads ligada, os testes entrariam lá como conversão de verdade e
// falsificariam o custo por lead da primeira campanha.
//
// Quem EXCLUI é o GA4: existe um filtro "Internal Traffic" ativo no painel que
// joga fora todo evento com `traffic_type = internal`. Este arquivo só MARCA.
//
// ⚠️ O valor tem que ser exatamente `internal` — o filtro compara por
// correspondência exata. Qualquer variação ("interno", "INTERNAL") passa batido
// e a visita volta a contar, sem erro em lugar nenhum.
//
// ── POR QUE NATIVO, SE JÁ EXISTIAM DUAS MARCAÇÕES ───────────────────────────
//
// As duas anteriores marcam de fora, e cada uma quebra do seu jeito:
//
//   • regra por IP no GA4 — para de casar quando a operadora renova o IP ou o
//     modem reinicia. Em silêncio.
//   • variável do GTM lendo o cookie `stc_attrib` — a v5 não funcionou porque
//     supôs que o cookie guardava `utmSource` na raiz; ele guarda aninhado em
//     `{ primeiro, ultimo }`. Corrigido na v6, mas o aviso fica: mudança no
//     formato do cookie quebra a marcação sem gerar erro nenhum.
//
// Aqui a fonte é uma flag própria, que o site escreve e o site lê. Não depende
// de IP, nem de o cookie de atribuição continuar com a mesma forma.
//
// ⛔ NÃO REMOVER a variável do GTM por causa deste arquivo. As duas marcarem o
// mesmo parâmetro com o mesmo valor é idempotente — não há dobra. A do GTM sai
// depois, quando a nativa estiver provada, e essa decisão é da sessão de Ads.
// =============================================================================

/** `utm_source` que identifica uma visita de teste. */
export const UTM_INTERNO = 'teste_leo';

/** Flag persistida. Prefixo `stc_` = mesma família do cookie `stc_attrib`. */
export const CHAVE_INTERNO = 'stc_interno';

/** O único valor que o filtro do GA4 reconhece. */
export const VALOR_INTERNO = 'internal';

/**
 * Persistir é o ponto todo: só a página de ENTRADA tem o `utm_source` na URL.
 * Da segunda página em diante não há sinal nenhum, e sem a flag o resto da
 * sessão voltaria a contar como visitante real — que é exatamente o caso que
 * sujou o relatório.
 */
function marcar(): void {
  try {
    localStorage.setItem(CHAVE_INTERNO, '1');
  } catch {
    // Safari em janela privada, ou storage bloqueado. A visita segue marcada
    // enquanto a URL tiver o utm; o resto da navegação não. Não vale derrubar
    // nada por isso.
  }
}

function marcado(): boolean {
  try {
    return localStorage.getItem(CHAVE_INTERNO) === '1';
  } catch {
    return false;
  }
}

function utmDaUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('utm_source') === UTM_INTERNO;
  } catch {
    return false;
  }
}

/**
 * Chamar na CHEGADA e a cada troca de rota (junto de `captureAttribution`).
 * Navegação client-side não re-executa o snippet do `<head>`, então uma entrada
 * por link interno com o utm só é vista aqui.
 */
export function marcarTrafegoInterno(): void {
  if (typeof window === 'undefined') return;
  if (utmDaUrl()) marcar();
}

/** Esta visita é teste? */
export function trafegoInterno(): boolean {
  if (typeof window === 'undefined') return false;
  return marcado() || utmDaUrl();
}

/**
 * Os parâmetros a juntar no evento. Objeto VAZIO quando a visita é real — não
 * `traffic_type: 'externo'` nem `undefined`: parâmetro que chega em todo evento
 * com valor vazio polui o relatório e não serve pra nada.
 */
export function paramsTrafegoInterno(): { traffic_type?: string } {
  return trafegoInterno() ? { traffic_type: VALOR_INTERNO } : {};
}

/**
 * Snippet inline do `<head>`, ANTES do container.
 *
 * Por que inline e não só no React: o `page_view` sai quando o GTM carrega, e o
 * componente que roda `marcarTrafegoInterno()` só existe depois da hidratação.
 * Marcando aqui, a flag já está gravada e o valor já está no `dataLayer` quando
 * a primeira tag dispara — inclusive na visita de estreia, que é justamente a
 * que traz o `utm_source` na URL.
 *
 * O push sem `event` não dispara nada: só deixa `traffic_type` disponível como
 * variável de camada de dados pro container, se a sessão de Ads quiser apontar
 * a variável dela pra cá em vez do cookie. Enquanto não apontar, é inerte.
 */
export const TRAFEGO_INTERNO_SNIPPET = `
window.dataLayer = window.dataLayer || [];
try {
  var qs = new URLSearchParams(window.location.search);
  if (qs.get('utm_source') === '${UTM_INTERNO}') localStorage.setItem('${CHAVE_INTERNO}', '1');
  if (localStorage.getItem('${CHAVE_INTERNO}') === '1') {
    window.dataLayer.push({ traffic_type: '${VALOR_INTERNO}' });
  }
} catch (e) {}
`.trim();
