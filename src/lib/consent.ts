// =============================================================================
// CONSENTIMENTO DE COOKIES — fonte única.
//
// ⚖️ Por que existe: até 08/09 o site carregava o GA assim que houvesse um ID
// em `site_settings`, SEM olhar o consentimento. O banner gravava a escolha e
// ninguém a lia. Bastaria colar o ID pro Google Analytics subir pra todo mundo,
// inclusive pra quem clicou "Apenas essenciais" — sem erro visível em lugar
// nenhum. Achado da própria sessão do site, corrigido antes de existir
// visitante real (o site está pré-lançamento).
//
// A correção é o **Consent Mode v2** do Google: as tags sobem com o
// consentimento NEGADO por padrão e são liberadas quando a pessoa aceita. Vale
// pro GA4 e pro Pixel de uma vez, porque os dois entram pelo GTM.
//
// ⚠️ A chave mudou de `msm-cookie-consent` (resíduo do template da MSM, outro
// cliente) para `somatec-cookie-consent`. A leitura aceita a antiga como
// fallback: quem já respondeu não é perguntado de novo.
// =============================================================================

export const CONSENT_KEY = 'somatec-cookie-consent';
/** Chave antiga, herdada do template MSM. Só leitura, pra não repetir a pergunta. */
export const CONSENT_KEY_LEGADO = 'msm-cookie-consent';

export type ConsentValue = 'accepted' | 'rejected';

/** Versão do TEXTO do banner. Mudou o texto, muda aqui — e quem respondeu a
 *  versão anterior é perguntado de novo.
 *
 *  B1 da auditoria 13/09: o registro era só a string `accepted`/`rejected`, sem
 *  versão nem data. Consequências: (1) se o texto mudasse — e ele VAI mudar,
 *  porque a página /cookies descreve outro site —, não havia como repedir o
 *  consentimento sem trocar a chave na mão; (2) quem respondeu no template da
 *  MSM (outro cliente, outro texto) contava como tendo consentido AQUI. */
export const CONSENT_VERSAO = 'v1';

export type ConsentRegistro = {
  escolha: ConsentValue;
  versao: string;
  em: string;
};

/** Lê o registro atual. Aceita o formato ANTIGO (string pura) pra não repetir
 *  a pergunta a quem já respondeu a ESTA versão do texto. */
export function lerConsentimento(): ConsentRegistro | null {
  if (typeof window === 'undefined') return null;
  try {
    const cru = localStorage.getItem(CONSENT_KEY);
    if (!cru) return null;
    if (cru === 'accepted' || cru === 'rejected') {
      // Formato antigo: sem versão. Vale como resposta à v1, que é o texto que
      // estava no ar quando ele foi gravado.
      return { escolha: cru, versao: 'v1', em: '' };
    }
    const r = JSON.parse(cru) as Partial<ConsentRegistro>;
    if (r.escolha !== 'accepted' && r.escolha !== 'rejected') return null;
    return { escolha: r.escolha, versao: r.versao ?? 'v1', em: r.em ?? '' };
  } catch {
    return null;
  }
}

export function gravarConsentimento(escolha: ConsentValue): void {
  if (typeof window === 'undefined') return;
  try {
    const registro: ConsentRegistro = {
      escolha,
      versao: CONSENT_VERSAO,
      em: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(registro));
  } catch {
    /* storage bloqueado — a escolha vale nesta sessão, via Consent Mode */
  }
}

/**
 * Snippet inline que roda ANTES de qualquer tag (GTM incluso) e declara o
 * estado inicial do consentimento. Precisa ser string: vai no `<Script>` do
 * layout com `beforeInteractive`, e o Consent Mode exige que o `default` chegue
 * antes do container — depois já é tarde, a tag disparou.
 *
 * Lê a escolha já gravada pra não perder evento de quem aceitou numa visita
 * anterior (sem isso, todo retorno começaria negado até o banner reaparecer —
 * e ele não reaparece).
 */
export const CONSENT_DEFAULT_SNIPPET = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
var c = null;
try { c = localStorage.getItem('${CONSENT_KEY}') || localStorage.getItem('${CONSENT_KEY_LEGADO}'); } catch (e) {}
/* Formato antigo é a string pura; o novo é JSON com escolha+versao+em. */
var escolha = c;
if (c && c.charAt(0) === '{') { try { escolha = (JSON.parse(c) || {}).escolha; } catch (e) { escolha = null; } }
var v = escolha === 'accepted' ? 'granted' : 'denied';
gtag('consent', 'default', {
  ad_storage: v,
  ad_user_data: v,
  ad_personalization: v,
  analytics_storage: v,
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
`.trim();

/**
 * Avisa as tags da escolha do visitante, na hora em que ele clica.
 *
 * `wait_for_update` no default segura a tag por meio segundo esperando isto —
 * é o que permite medir quem aceita sem recarregar a página.
 */
export function aplicarConsentimento(valor: ConsentValue): void {
  if (typeof window === 'undefined') return;
  const v = valor === 'accepted' ? 'granted' : 'denied';
  try {
    window.gtag?.('consent', 'update', {
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v,
      analytics_storage: v,
    });
    // Gatilho próprio: no GTM dá pra pendurar tag no evento em vez de depender
    // só do Consent Mode.
    window.dataLayer?.push({ event: 'consentimento_atualizado', consentimento: valor });
  } catch {
    // analytics nunca pode quebrar a UI
  }
}
