// =============================================================================
// VOCABULÁRIO APOSENTADO DA OFERTA — fonte única.
//
// Existe porque a guarda de copy (tests/copy-guards.test.ts) varre ARQUIVOS, e
// o site também serve conteúdo que vem do BANCO: o blog inteiro é
// `posts.content_html`. Em 07/09 achamos 15 artigos no Supabase vendendo a
// oferta que morreu em 03/09 — os `.md` do repo do blog tinham sido corrigidos,
// o que já estava carregado no CMS não. Nenhuma varredura alcançava aquilo.
//
// Este módulo é importado pelo script de varredura do banco e pelo teste que
// impede a lista de ser esvaziada. Mudou a oferta, muda AQUI.
//
// ⚠️ A REGRA QUE FAZ ESTA LISTA FUNCIONAR: procurar pela MECÂNICA, não pelo
// preço. Foi assim que "avaliação com medição na própria instalação" passou por
// todas as guardas — elas vigiavam `gratuita` e `sem custo`, e a frase não usava
// nenhuma das duas. O que define a oferta extinta não é ser grátis: é ir medir
// antes do contrato.
// =============================================================================

/** @type {Array<{ re: RegExp, morreu: string, porque: string }>} */
export const APOSENTADO = [
  // ── 20/08 — acabou a medição/diagnóstico antes do contrato ────────────────
  { re: /medi[çc][ãa]o gratuita/i, morreu: '20/08', porque: 'medição antes do contrato' },
  { re: /medi[çc][ãa]o sem custo/i, morreu: '20/08', porque: 'medição antes do contrato' },
  { re: /medi[çc][ãa]o na sua planta/i, morreu: '20/08', porque: 'medição antes do contrato' },
  { re: /medi[çc][ãa]o na sua rede/i, morreu: '20/08', porque: 'medição antes do contrato' },
  { re: /medi[çc][ãa]o na pr[óo]pria instala[çc][ãa]o/i, morreu: '20/08', porque: 'medição antes do contrato' },
  { re: /avalia[çc][ãa]o.{0,40}com medi[çc][ãa]o/i, morreu: '20/08', porque: 'medição como etapa de entrada' },
  { re: /diagn[óo]stico gratuito/i, morreu: '20/08', porque: 'diagnóstico prévio de graça' },
  { re: /diagn[óo]stico.{0,20}sem custo/i, morreu: '20/08', porque: 'diagnóstico prévio de graça' },

  // ── 25/08 — no industrial não se vende equipamento nem software avulso ────
  { re: /pacote anual de software/i, morreu: '25/08', porque: 'software avulso no industrial' },

  // ── 03/09 — acabou o período de avaliação e o pagamento condicionado ──────
  { re: /60 a 90 dias/i, morreu: '03/09', porque: 'período de avaliação' },
  { re: /per[íi]odo de avalia[çc][ãa]o/i, morreu: '03/09', porque: 'período de avaliação' },
  { re: /(s[óo] paga|paga s[óo]).{0,40}comprovad/i, morreu: '03/09', porque: 'pagamento condicionado ao resultado' },
  { re: /resultado for comprovado/i, morreu: '03/09', porque: 'pagamento condicionado ao resultado' },
  { re: /(cinco|5) etapas sem custo/i, morreu: '03/09', porque: 'as cinco etapas sem custo' },
  { re: /(zero risco|risco zero)/i, morreu: '03/09', porque: 'promessa de risco zero' },

  // ── 04/09 — quem paga a instalação é o cliente; a saída tem janela ────────
  { re: /n[ãa]o paga nada at[ée]/i, morreu: '04/09', porque: 'não paga até a instalação' },
  { re: /instala[çc][ãa]o sem custo/i, morreu: '04/09', porque: 'a instalação é paga pelo cliente' },
  { re: /(encerra|cancela) quando quiser/i, morreu: '04/09', porque: 'a saída tem janela, não é a qualquer momento' },
  { re: /(depois de|a partir de) 12 meses.{0,30}(encerrar|cancelar|sair)/i, morreu: '04/09', porque: 'os 12 meses abrem uma janela de 60 dias, não liberam saída permanente' },
];

/**
 * Padrões próprios pra SLUG.
 *
 * Slug come as palavras de ligação: `periodo-avaliacao-60-90-dias` não casa
 * com /período de avaliação/ nem com /60 a 90 dias/ — faltam o "de" e o "a".
 * Escrevi a checagem de slug reusando a lista de cima e ela era decorativa;
 * só notei porque o post que tem a oferta no próprio slug estava sendo pego
 * pelo título e não por ele.
 *
 * Slug importa mais que o resto: vira URL pública, e corrigir depois de
 * publicado exige redirect.
 *
 * @type {Array<{ re: RegExp, morreu: string, porque: string }>}
 */
export const APOSENTADO_SLUG = [
  { re: /periodo[- ]?avaliacao/i, morreu: '03/09', porque: 'período de avaliação no slug' },
  { re: /60[- ]?90[- ]?dias/i, morreu: '03/09', porque: 'os 60-90 dias no slug' },
  { re: /medicao[- ]?(gratuita|sem[- ]?custo)/i, morreu: '20/08', porque: 'medição gratuita no slug' },
  { re: /risco[- ]?zero|zero[- ]?risco/i, morreu: '03/09', porque: 'risco zero no slug' },
  { re: /avaliacao[- ]?gratuita/i, morreu: '03/09', porque: 'avaliação gratuita no slug' },
];

/**
 * Frases que PARECEM proibidas e são legítimas. Se a guarda reprovar uma
 * destas, ela ficou larga demais — e larga demais apaga argumento que vende.
 */
export const PERMITIDO = [
  'estudo, projeto e proposta sem custo',
  'a Somatec retira o equipamento sem custo',
  'comprovada por medição do software depois de instalado',
  'o software mostra a medição antes e depois',
  '92% de supressão de VTCD, medida em campo',
];
