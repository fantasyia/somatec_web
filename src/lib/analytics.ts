// =============================================================================
// Analytics — emissor de eventos fino e seguro. O GA4 (gtag) só carrega quando
// o admin configura o ID (ver layout.tsx); este helper é NO-OP quando o gtag
// não existe, então pode ser chamado de qualquer client component sem guarda.
// Também empurra pro dataLayer (GTM/consumidores futuros). Preserva UTM: o
// backend do lead recebe a atribuição via cookie stc_attrib (lib/attribution).
// =============================================================================

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Emite um evento de funil. Seguro em SSR e sem gtag (vira no-op). */
export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', name, params);
    window.dataLayer?.push({ event: name, ...params });
  } catch {
    // analytics nunca pode quebrar a UI
  }
}
