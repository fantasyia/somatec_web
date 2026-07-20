// =============================================================================
// Atribuição de marketing (UTM / gclid / fbclid) — captura no NAVEGADOR.
//
// Cookie first-party `stc_attrib` (funcional, LGPD decidido: seta sempre na
// chegada, sem gate de consentimento). Guarda PRIMEIRO toque (nunca sobrescreve)
// e ÚLTIMO toque (atualiza a cada visita com UTM). Janela de 90 dias, domínio
// .somatecblocking.com.br (compartilha com subdomínios futuros, ex: blog.).
//
// Contrato (fechado pelo dev do Betinna): o site envia o valor CRU da
// querystring em camelCase; o backend normaliza (lower/trim) e sanitiza. Só
// aplicamos um cap de tamanho por valor, pra não estourar o cookie.
// =============================================================================

export type AttributionTouch = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  referrer?: string;
  capturadoEm?: string;
};

export type Attribution = { primeiro: AttributionTouch; ultimo: AttributionTouch };

const COOKIE_NAME = 'stc_attrib';
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 dias
const MAX_LEN = 512; // cap defensivo por valor (o backend sanitiza de verdade)

// querystring (snake_case, padrão de mercado) → chave camelCase do contrato.
const QUERY_KEYS: ReadonlyArray<readonly [string, keyof AttributionTouch]> = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
  ['utm_content', 'utmContent'],
  ['utm_term', 'utmTerm'],
  ['gclid', 'gclid'],
  ['fbclid', 'fbclid'],
];

function cap(v: string): string {
  return v.length > MAX_LEN ? v.slice(0, MAX_LEN) : v;
}

/** Lê a querystring atual e monta um toque — ou null se não há sinal de campanha. */
function readQueryTouch(): AttributionTouch | null {
  const params = new URLSearchParams(window.location.search);
  const touch: AttributionTouch = {};
  let hasSignal = false;
  for (const [qs, key] of QUERY_KEYS) {
    const raw = params.get(qs);
    if (raw && raw.length > 0) {
      touch[key] = cap(raw);
      hasSignal = true;
    }
  }
  if (!hasSignal) return null; // direto/orgânico → sem atribuição
  touch.landingPage = cap(window.location.pathname);
  if (document.referrer) touch.referrer = cap(document.referrer);
  touch.capturadoEm = new Date().toISOString();
  return touch;
}

/** Seta o domínio só quando estamos em produção (subdomínios futuros).
 *  Em localhost/preview, cookie host-only — o browser ignora um domain fora do host. */
function cookieDomainAttr(): string {
  const h = window.location.hostname;
  return h === 'somatecblocking.com.br' || h.endsWith('.somatecblocking.com.br')
    ? '; domain=.somatecblocking.com.br'
    : '';
}

function readCookie(): Attribution | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Attribution;
    return parsed && parsed.primeiro && parsed.ultimo ? parsed : null;
  } catch {
    return null;
  }
}

function writeCookie(a: Attribution): void {
  const value = encodeURIComponent(JSON.stringify(a));
  document.cookie =
    `${COOKIE_NAME}=${value}` +
    `; max-age=${MAX_AGE_SECONDS}` +
    `; path=/${cookieDomainAttr()}` +
    '; SameSite=Lax' +
    (window.location.protocol === 'https:' ? '; Secure' : '');
}

/**
 * Chamar na CHEGADA do visitante (mount + troca de rota). Grava o PRIMEIRO toque
 * uma única vez (nunca sobrescreve) e atualiza o ÚLTIMO a cada visita com UTM.
 * No-op quando a URL atual não tem sinal de campanha.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  const touch = readQueryTouch();
  if (!touch) return;
  const existing = readCookie();
  const primeiro = existing?.primeiro ?? touch; // 1º toque nunca muda
  writeCookie({ primeiro, ultimo: touch }); // último toque sempre atualiza
}

/**
 * Chamar no SUBMIT do formulário. Retorna o bloco `atribuicao` (primeiro+ultimo)
 * ou undefined — nesse caso o formulário OMITE o bloco do payload (tráfego
 * direto/orgânico entra normal, sem atribuição).
 */
export function getAtribuicao(): Attribution | undefined {
  if (typeof window === 'undefined') return undefined;
  return readCookie() ?? undefined;
}
