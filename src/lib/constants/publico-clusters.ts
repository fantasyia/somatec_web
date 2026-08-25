// =============================================================================
// Público NI de um artigo — DERIVADO DO CLUSTER (decisão do Léo, 2026-07-27).
//
// O artigo NÃO declara "público": declara só o cluster, e este arquivo é a
// ÚNICA config que traduz cluster → público. Incluir um cluster novo = 1 linha
// aqui, sem tocar em nenhum componente. Elimina o risco de esquecerem de
// preencher um campo no front-matter.
//
// Aceita as DUAS formas de identificar o cluster: o id do cluster-mapa e o
// rótulo exibido no site (`BlogPost.cluster`, ex.: 'Residencial'). Quando a
// integração com o CMS chegar e os artigos trouxerem o id, ele já resolve —
// sem migração.
//
// ⚠️ 2026-08-05 — os clusters foram consolidados de 42 para 24 e os ids
// deixaram de ser códigos (c14, c38…) e viraram SLUGS. Este arquivo foi
// atualizado conforme `leo-Skills-master/clients/somatec/reports/site/lp-ni-spec.md`.
// Os códigos velhos não existem mais em lugar nenhum e saíram daqui.
// =============================================================================

export type PublicoNI = 'residencial' | 'comercial';

/** cluster (código do cluster-mapa OU rótulo do site) → público. */
export const CLUSTER_PUBLICO: Readonly<Record<string, PublicoNI>> = {
  // ── Residencial ──────────────────────────────────────────────────────
  residencial: 'residencial', // absorveu os antigos c14 + c39
  Residencial: 'residencial',
  'Residências Alto Padrão': 'residencial',
  'Alto Padrão Premium': 'residencial',
  'carro-eletrico': 'residencial', // ex-c38
  'Carro Elétrico': 'residencial',
  'Veículos Elétricos': 'residencial',

  // ── Comercial (comércio, condomínio, pequeno fabricante) ─────────────
  comercio: 'comercial', // absorveu os antigos c13 + c40
  Comércio: 'comercial',
  'Comércio / Varejo / Serviços': 'comercial',
  'Pequenos Fabricantes & Comércio': 'comercial',
  condominios: 'comercial', // ex-c18
  Condomínios: 'comercial',
  frio: 'comercial', // ex-c25
  'Cadeia Fria': 'comercial',
  'Cadeia do Frio': 'comercial',

  // Todo o resto = industrial → não entra nas LPs NI (basta não estar aqui).
};

/** Público do artigo, ou null se o cluster dele é industrial/desconhecido. */
export function publicoDoCluster(cluster: string | undefined | null): PublicoNI | null {
  if (!cluster) return null;
  return CLUSTER_PUBLICO[cluster.trim()] ?? null;
}
