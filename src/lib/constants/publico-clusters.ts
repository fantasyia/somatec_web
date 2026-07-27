// =============================================================================
// Público NI de um artigo — DERIVADO DO CLUSTER (decisão do Léo, 2026-07-27).
//
// O artigo NÃO declara "público": declara só o cluster, e este arquivo é a
// ÚNICA config que traduz cluster → público. Incluir um cluster novo = 1 linha
// aqui, sem tocar em nenhum componente. Elimina o risco de esquecerem de
// preencher um campo no front-matter.
//
// Aceita as DUAS formas de identificar o cluster: o código do cluster-mapa
// (c14, c38…) e o rótulo exibido no site (`BlogPost.cluster`, ex.: 'Residencial').
// Quando a integração com o WP chegar e os artigos trouxerem o código, ele já
// resolve — sem migração.
// =============================================================================

export type PublicoNI = 'residencial' | 'comercial';

/** cluster (código do cluster-mapa OU rótulo do site) → público. */
export const CLUSTER_PUBLICO: Readonly<Record<string, PublicoNI>> = {
  // ── Residencial ──────────────────────────────────────────────────────
  c14: 'residencial', // Residências Alto Padrão
  'Residências Alto Padrão': 'residencial',
  Residencial: 'residencial',
  c38: 'residencial', // Veículos Elétricos
  'Veículos Elétricos': 'residencial',
  c39: 'residencial', // Alto Padrão Premium
  'Alto Padrão Premium': 'residencial',

  // ── Comercial (comércio, condomínio, pequeno fabricante) ─────────────
  c13: 'comercial', // Comércio / Varejo / Serviços
  'Comércio / Varejo / Serviços': 'comercial',
  Comércio: 'comercial',
  c18: 'comercial', // Condomínios
  Condomínios: 'comercial',
  c25: 'comercial', // Cadeia do Frio
  'Cadeia do Frio': 'comercial',
  c40: 'comercial', // Pequenos Fabricantes & Comércio
  'Pequenos Fabricantes & Comércio': 'comercial',

  // Todo o resto = industrial → não entra nas LPs NI (basta não estar aqui).
};

/** Público do artigo, ou null se o cluster dele é industrial/desconhecido. */
export function publicoDoCluster(cluster: string | undefined | null): PublicoNI | null {
  if (!cluster) return null;
  return CLUSTER_PUBLICO[cluster.trim()] ?? null;
}
