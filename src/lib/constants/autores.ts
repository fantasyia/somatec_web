// =============================================================================
// Quem assina o conteúdo do blog.
//
// Proteção elétrica é YMYL — segurança de pessoas e dinheiro de empresa. O
// Google cobra E-E-A-T nesse tipo de página, e o que dá peso é a PESSOA, não a
// empresa: artigo técnico assinado só por "Somatec Blocking" vale menos que o
// mesmo artigo revisado por um engenheiro com registro.
//
// ⚠️ SÓ ENTRA O QUE O LÉO INFORMOU — campo sem dado fica VAZIO.
// Em página YMYL, credencial inventada é PIOR que credencial ausente — é
// exatamente o que o algoritmo pune. O author box entende campo vazio e
// simplesmente não renderiza a linha. Bios e cargos vieram do Léo em 25/09/2026.
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

// Ano em que o Leandro ENTROU na empresa (Léo, 25/09/2026) — não é quando virou
// sócio nem diretor, e a sucessão não vai pro site. A bio diz "há mais de N anos",
// calculado, pra nunca envelhecer. Nunca escrever o ano colado ao nome da
// empresa: a Somatec é de 1999, e isso seria lido — por gente e por IA — como
// data de fundação (guarda em tests/ano-de-fundacao.test.ts).
const LEANDRO_ENTROU = 2011;
/** "Mais de N": o −1 garante que é verdade o ano inteiro, mesmo em janeiro. */
const anosDeLeandro = new Date().getFullYear() - LEANDRO_ENTROU - 1;

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
    // `nome` fica curto: é a chave que casa com `reviewed_by` no CMS. O nome
    // completo vai na bio.
    nome: 'Leandro Lima',
    papel: 'Sócio-diretor — Somatec Blocking',
    credencial: '',
    bio:
      'Leandro de Albuquerque Pereira Lima é sócio-diretor da Somatec Blocking. ' +
      `Está na empresa há mais de ${anosDeLeandro} anos. ` +
      'Formado em Direito, atua nas áreas comercial e jurídica, ' +
      'na venda e na elaboração de contratos de projetos de eficiência energética.',
    foto: null,
    revisor: true,
  },
  // 🚫 Marcelo Harada saiu desta lista em 18/09/2026, a pedido do Léo. Quem
  // assina é o Leandro (sócio-diretor), o José Fernando Nunes (engenheiro) e a redação —
  // mais ninguém. Não era perfil incompleto por esquecimento: ele não assina.
  // Saiu sem rastro: nenhum dos 378 posts (nem os apagados) tinha o nome dele
  // em author_name, reviewed_by, expert_name ou no corpo — conferido no banco
  // antes de remover, não deduzido.
  {
    // Nome e CREA informados pelo Léo em 18/09/2026. Antes era o placeholder
    // "Fernando Engenheiro", que lia como campo por preencher numa página YMYL.
    // O que dá peso em conteúdo elétrico é o registro, e agora ele está aqui.
    slug: 'jose-fernando-nunes',
    nome: 'José Fernando Nunes',
    // Cargo e bio informados pelo Léo em 25/09/2026. Antes estava "engenheiro
    // eletricista", que foi dedução nossa, não dado dele.
    papel: 'Engenheiro de manutenção',
    credencial: 'CREA-SP 5060776733',
    bio:
      'Engenheiro de manutenção especializado em eficiência energética e em gestão ' +
      'de manutenção de sistemas de alta criticidade.',
    // 🔒 SEM FOTO POR VONTADE DELE — decisão do Léo em 15/09, reafirmada em
    // 18/09, não é pendência.
    //
    // Ele segue como revisor público (nome + CREA); o que ele não quer é o
    // rosto. A tela trata isto: sem foto, `AvatarAutor` desenha o MONOGRAMA
    // (JN) no círculo — identificação, não retrato. ⛔ Não "consertar" pondo
    // foto de banco de imagem nem retrato gerado: numa página sobre risco
    // elétrico, um rosto que não é de ninguém derruba a confiança na página
    // inteira quando alguém percebe.
    // Guarda em `tests/eeat-autores.test.ts`.
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
