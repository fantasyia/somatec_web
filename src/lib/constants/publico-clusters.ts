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

  // ── 2026-09-07: os silos foram de 25 pra 31 (regra "silo é UM assunto") ──
  //
  // Dois silos NI nasceram nessa reestruturação e precisam de linha aqui,
  // senão o artigo deles é tratado como industrial e SOME das duas LPs — sem
  // erro nenhum, porque "não está no mapa" e "é industrial" são a mesma coisa
  // pra este arquivo.
  //
  // `pequena-industria` (pf01–pf06: CNC, solda, prensa, forno) saiu de dentro
  // de `comercio` e herda o mesmo motor: compra direta.
  'pequena-industria': 'comercial',
  'Pequena indústria': 'comercial',
  //
  // `nichos-digitais` (d01–d06, e05: cripto em casa, impressora 3D, estúdio de
  // áudio) saiu de `tecnologia`. A maioria é uso doméstico/maker — o estúdio de
  // áudio é a exceção. Classificação recomendada pela master em 07/09.
  'nichos-digitais': 'residencial',
  'Nichos digitais': 'residencial',
  //
  // ⚠️ `data-center-telecom`, a outra metade do antigo `tecnologia`, é
  // INDUSTRIAL e por isso NÃO entra aqui. O mesmo vale pros outros silos novos
  // (autodiagnostico, decisores, parceiros, processo, equipamentos,
  // obsolescencia): ausência aqui é a forma de dizer "industrial".

  // Todo o resto = industrial → não entra nas LPs NI (basta não estar aqui).
};

/**
 * Silos que são INDUSTRIAIS de propósito — declarados, não esquecidos.
 *
 * Existe porque "não está no mapa" e "é industrial" produzem o MESMO resultado
 * (`publicoDoCluster` devolve null), e o sintoma é mudo: o artigo simplesmente
 * não aparece em LP nenhuma, sem erro em lugar nenhum.
 *
 * Com esta lista, o teste consegue exigir que TODO silo do `cluster-mapa.html`
 * esteja classificado num dos dois lados. Silo novo que ninguém classificou
 * quebra o build em vez de sumir calado — e isso já aconteceu duas vezes:
 * 42→24 em 05/08 e 25→31 em 07/09.
 */
export const CLUSTER_INDUSTRIAL: readonly string[] = [
  'agro',
  'alimenticio',
  'autodiagnostico',
  'custo',
  'data-center-telecom',
  'decisores',
  'equipamentos',
  'farmaceutico',
  'manutencao',
  'metalurgia',
  'mineracao',
  'normas',
  'obsolescencia',
  'parceiros',
  'plasticos',
  'processo',
  'protecao',
  'qualidade-energia',
  'saneamento',
  'saude',
  'solar',
  'somatec',
  'textil',
  'vtcd',
];

/** Público do artigo, ou null se o cluster dele é industrial/desconhecido. */
export function publicoDoCluster(cluster: string | undefined | null): PublicoNI | null {
  if (!cluster) return null;
  return CLUSTER_PUBLICO[cluster.trim()] ?? null;
}
