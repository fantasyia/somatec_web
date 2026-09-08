// =============================================================================
// Analytics — emissor de eventos fino e seguro. NO-OP quando não há tag
// carregada, então pode ser chamado de qualquer client component sem guarda.
// Preserva UTM: o backend do lead recebe a atribuição via cookie stc_attrib
// (lib/attribution), que NÃO passa por consentimento — é first-party funcional,
// e gatear quebraria a corrente site→Betinna em silêncio (o lead entraria sem
// origem, e atribuição não tem backfill).
//
// ⚠️ UM CAMINHO SÓ, NUNCA OS DOIS (achado da sessão de Ads, 08/09):
//
//   • com GTM  → empurra só pro `dataLayer`. O container distribui pro GA4 e
//     pro Pixel. Se também chamasse `gtag`, o GA4 receberia o MESMO evento duas
//     vezes — pelo gtag e pelo container — e o relatório contaria em dobro, sem
//     erro nenhum aparecendo.
//   • sem GTM  → chama `gtag` direto, porque o gtag.js NÃO transforma um push
//     avulso de `{event: …}` em evento do GA4. Só o dataLayer não bastaria.
//
// A flag `__somatecGTM` é escrita pelo próprio script do container no layout,
// antes de ele carregar — então vale já no primeiro evento, sem corrida.
// =============================================================================

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    /** true quando o container GTM foi renderizado (ver layout.tsx). */
    __somatecGTM?: boolean;
  }
}

/** Emite um evento de funil. Seguro em SSR e sem gtag (vira no-op). */
export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.__somatecGTM) {
      window.dataLayer?.push({ event: name, ...params });
    } else {
      window.gtag?.('event', name, params);
    }
  } catch {
    // analytics nunca pode quebrar a UI
  }
}
