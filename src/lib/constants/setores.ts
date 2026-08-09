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
// ✅ Lista FECHADA pela master em 2026-08-05 (registrada em icp-setores.md).
//
// Por que o prefixo `x:` mesmo com as tags de hoje sendo soltas: são coisas
// diferentes. `triado`/`cold`/`email-mkt` são tag-FLAG (booleana: existe ou
// não); isto aqui é tag-DIMENSÃO (uma chave com dezenas de valores). Dimensão
// precisa de namespace por causa do filtro do fluxo — sem prefixo, um
// contains "industria" casaria também com "agroindustria" e daria falso
// positivo silencioso na nutrição. As duas convenções convivem de propósito.
//
// FAMÍLIA de nutrição (producao/frio/equipamento/dados) NÃO sai daqui: quem
// deriva é o Betinna, a partir da etiqueta de setor. Motivo: o mapa é decisão
// de marketing e vai mudar — derivado no fluxo, muda sem deploy do site e vale
// retroativo; e as calculadoras não perguntam setor, então uma família mandada
// pelo site nasceria vazia justo nos leads mais quentes.
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

/** CAMPO 2 — aparece conforme o público. Lista FECHADA pela master (2026-08-05).
 *
 *  `condominios`, `carros-eletricos`, `cadeia-do-frio`, `saude` e `energia-solar`
 *  aparecem em mais de um público de propósito: o mesmo ramo chega por lados
 *  diferentes (frigorífico é Grupo A com cabine; clínica pequena é Grupo B). A
 *  chave do lead é o PAR público + setor, não o setor sozinho.
 *
 *  ⚠️ Carro elétrico: o escopo comprovável é proteger a INSTALAÇÃO de recarga
 *  (wallbox, eletroposto, rede da casa) — nunca a bateria do veículo, que é
 *  coberta pelo BMS do carro. O rótulo abaixo tem que refletir isso. */
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
    { slug: 'cadeia-do-frio', label: 'Cadeia do frio (frigorífico, laticínio)' },
    { slug: 'agronegocio', label: 'Agronegócio' },
    { slug: 'saude', label: 'Saúde (hospital)' },
    { slug: 'saneamento-utilities', label: 'Saneamento e utilities' },
    { slug: 'energia-solar', label: 'Energia solar em escala' },
    { slug: 'data-center-telecom', label: 'Data center e telecom' },
  ],
  comercio: [
    { slug: 'cadeia-do-frio', label: 'Cadeia do frio (refrigeração comercial)' },
    { slug: 'varejo', label: 'Varejo (supermercado, farmácia, CDD)' },
    { slug: 'condominios', label: 'Condomínios' },
    { slug: 'tecnologia-ti', label: 'Tecnologia e TI' },
    { slug: 'carros-eletricos', label: 'Recarga de carro elétrico' },
    { slug: 'pequenos-fabricantes', label: 'Pequenos fabricantes e comércio' },
    { slug: 'saude', label: 'Saúde (clínica, laboratório)' },
    // `saude` já cobre clínica e laboratório; sobrava salão/academia/lavanderia
    // sem recorte — caíam em varejo ou outros (despacho 2026-08-09).
    { slug: 'servicos', label: 'Serviços (salão, academia, lavanderia)' },
    { slug: 'energia-solar', label: 'Energia solar' },
  ],
  residencia: [
    { slug: 'residencia-alto-padrao', label: 'Residência de alto padrão' },
    { slug: 'condominios', label: 'Condomínio' },
    { slug: 'carros-eletricos', label: 'Recarga de carro elétrico' },
    { slug: 'energia-solar', label: 'Energia solar' },
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
