// =============================================================================
// Quem assina o conteúdo do blog.
//
// Proteção elétrica é YMYL — segurança de pessoas e dinheiro de empresa. O
// Google cobra E-E-A-T nesse tipo de página, e o que dá peso é a PESSOA, não a
// empresa: artigo técnico assinado só por "Somatec Blocking" vale menos que o
// mesmo artigo revisado por um engenheiro com registro.
//
// ⚠️ FOTO, BIO E CREDENCIAL ESTÃO VAZIAS DE PROPÓSITO.
// Em página YMYL, credencial inventada é PIOR que credencial ausente — é
// exatamente o que o algoritmo pune. O author box entende campo vazio e
// simplesmente não renderiza a linha. Preencher é decisão do Léo.
//
// ⚠️ Esta lista espelha `lib/site/collaborators.ts` do CMS. São dois repos, e
// não há como um importar do outro: quem mudar um tem de mudar o outro. O
// teste `tests/autores.test.ts` guarda o que dá pra guardar daqui.
// =============================================================================

export type Autor = {
  /** Vira /autor/<slug>. */
  slug: string;
  /** Exatamente como está gravado em `author_name` / `reviewed_by` no CMS —
   *  é por este texto que o artigo casa com o perfil. */
  nome: string;
  papel: string;
  /** Registro profissional. Em conteúdo elétrico, é o que sustenta a revisão. */
  credencial: string;
  bio: string;
  foto: string | null;
  /** true = pode assinar como revisor técnico. A redação não revisa a si
   *  mesma: revisor igual ao autor anula o sentido do campo. */
  revisor: boolean;
};

export const AUTORES: readonly Autor[] = [
  {
    slug: 'redator-somatec',
    nome: 'Redator Somatec Blocking',
    papel: 'Redação — Somatec Blocking',
    credencial: '',
    bio: '',
    foto: null,
    revisor: false,
  },
  {
    slug: 'leandro-lima',
    nome: 'Leandro Lima',
    papel: 'CEO — Somatec Blocking',
    credencial: '',
    bio: '',
    foto: null,
    revisor: true,
  },
  {
    slug: 'marcelo-harada',
    nome: 'Marcelo Harada',
    papel: 'Técnico — Somatec Blocking',
    credencial: '',
    bio: '',
    foto: null,
    revisor: true,
  },
  {
    // ⚠️ Nome incompleto — pendência aberta com o Léo. "Revisado por Fernando
    // Engenheiro" lê como placeholder numa página YMYL, e o que dá peso em
    // conteúdo elétrico é o CREA. Falta sobrenome + registro.
    slug: 'fernando-engenheiro',
    nome: 'Fernando Engenheiro',
    papel: 'Engenheiro eletricista',
    credencial: '',
    bio: '',
    foto: null,
    revisor: true,
  },
] as const;

function normalizar(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Acha o perfil pelo nome gravado no artigo. Tolerante a acento e espaço
 *  sobrando — o campo vem de um select, mas post antigo pode ter texto livre. */
export function autorPorNome(nome: string | null | undefined): Autor | undefined {
  if (!nome?.trim()) return undefined;
  const alvo = normalizar(nome);
  return AUTORES.find((a) => normalizar(a.nome) === alvo);
}

export function autorPorSlug(slug: string): Autor | undefined {
  return AUTORES.find((a) => a.slug === slug);
}

/** Só quem tem página própria: perfil sem nada preenchido além do nome ainda
 *  vale a página (lista os artigos), mas o redator genérico não. */
export function autoresComPagina(): Autor[] {
  return AUTORES.filter((a) => a.slug !== 'redator-somatec');
}
