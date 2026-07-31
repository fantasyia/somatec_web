// =============================================================================
// Taxonomia de PÚBLICO e SETOR do lead — fonte única das etiquetas.
//
// O formulário captura público + setor e manda como ETIQUETA pro Betinna; é a
// etiqueta que roteia o lead pro fluxo de nutrição certo. Por isso o nome aqui
// precisa ser EXATAMENTE o que o fluxo filtra do outro lado.
//
// ⚠️ Trocar o padrão de nome = editar SÓ este arquivo. Nenhum outro lugar
// escreve nome de etiqueta.
//
// 🔲 Pendente da master: hoje nenhuma etiqueta do app usa prefixo `x:` (as que
// existem são soltas — `triado`, `cold`, `email-mkt`, `rep-SP`). O padrão com
// prefixo abaixo veio do card do site; se a master preferir sem, é aqui.
//
// Lista canônica: clients/somatec/reports/prospeccao/icp-setores.md
// =============================================================================

export type PublicoId = 'industria' | 'comercio' | 'residencia';

export type Publico = {
  id: PublicoId;
  label: string;
  /** Ajuda curta no rádio/select. */
  descricao: string;
};

/** CAMPO 1 — define o funil e a oferta.
 *  ⛔ Industrial = locação · Não-industrial = compra direta. Nunca cruzar. */
export const PUBLICOS: readonly Publico[] = [
  { id: 'industria', label: 'Indústria', descricao: 'Planta com subestação ou cabine primária' },
  { id: 'comercio', label: 'Comércio', descricao: 'Loja, mercado, restaurante, oficina, clínica' },
  { id: 'residencia', label: 'Residência ou condomínio', descricao: 'Casa de alto padrão, prédio, condomínio' },
];

export type Setor = { slug: string; label: string };

/** CAMPO 2 — aparece conforme o público. Lista canônica do ICP. */
export const SETORES: Readonly<Record<PublicoId, readonly Setor[]>> = {
  industria: [
    { slug: 'autopecas', label: 'Autopeças' },
    { slug: 'metalurgia', label: 'Metalurgia' },
    { slug: 'siderurgia', label: 'Siderurgia' },
    { slug: 'mineracao', label: 'Mineração' },
    { slug: 'alimenticio-bebidas', label: 'Alimentício e bebidas' },
    { slug: 'farmaceutico-quimico', label: 'Farmacêutico e químico' },
    { slug: 'papel-celulose', label: 'Papel e celulose' },
    { slug: 'textil-confeccao-calcados', label: 'Têxtil, confecção e calçados' },
    { slug: 'plasticos-borracha-embalagem', label: 'Plásticos, borracha e embalagem' },
    { slug: 'agronegocio', label: 'Agronegócio' },
    { slug: 'saude', label: 'Saúde (hospitais e clínicas)' },
    { slug: 'saneamento-utilities', label: 'Saneamento e utilities' },
    { slug: 'energia-solar-escala', label: 'Energia solar em escala' },
    { slug: 'data-center-isp-telecom', label: 'Data center, ISP e telecom' },
  ],
  comercio: [
    { slug: 'cadeia-do-frio', label: 'Cadeia do frio (refrigeração comercial)' },
    { slug: 'varejo', label: 'Varejo (supermercado, farmácia, CDD)' },
    { slug: 'condominios', label: 'Condomínios' },
    { slug: 'tecnologia-data-center-pequeno', label: 'Tecnologia / data center pequeno' },
    { slug: 'carros-eletricos', label: 'Carros elétricos (recarga)' },
    { slug: 'pequenos-fabricantes', label: 'Pequenos fabricantes e comércio' },
  ],
  residencia: [
    { slug: 'residencias-alto-padrao', label: 'Residência de alto padrão' },
    { slug: 'condominios', label: 'Condomínio' },
    { slug: 'carros-eletricos', label: 'Carro elétrico (recarga)' },
  ],
};

/** Escape obrigatório: quem não se encaixa não pode ficar sem etiqueta. Serve
 *  pra descobrir setor que falta na lista. */
export const SETOR_OUTROS: Setor = { slug: 'outros', label: 'Outros' };

export function setoresDoPublico(publico: PublicoId | ''): readonly Setor[] {
  if (!publico) return [];
  return [...SETORES[publico], SETOR_OUTROS];
}

// ── Nomes de etiqueta ────────────────────────────────────────────────────────
const PREFIXO_PUBLICO = 'publico:';
const PREFIXO_SETOR = 'setor:';

export const tagPublico = (p: PublicoId) => `${PREFIXO_PUBLICO}${p}`;
export const tagSetor = (slug: string) => `${PREFIXO_SETOR}${slug}`;

/** Etiquetas do lead a partir do que ele escolheu. Vazio se não escolheu nada
 *  (o campo de público é obrigatório no form, então na prática sempre vem). */
export function tagsDoLead(publico: PublicoId | '', setorSlug: string): string[] {
  const tags: string[] = [];
  if (publico) tags.push(tagPublico(publico));
  if (setorSlug) tags.push(tagSetor(setorSlug));
  return tags;
}

/** Rótulo legível pro resumo/mensagem do lead (o CRM mostra em "segmento"). */
export function rotuloSetor(publico: PublicoId | '', slug: string): string {
  if (!publico || !slug) return '';
  const achado = setoresDoPublico(publico).find((s) => s.slug === slug);
  return achado?.label ?? '';
}
