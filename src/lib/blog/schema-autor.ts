import { SITE } from '@/lib/constants/site';
import { autorPorNome } from '@/lib/constants/autores';
import type { Assinatura } from '@/lib/blog/fonte';

// =============================================================================
// author / reviewedBy do schema do artigo.
//
// Em YMYL o peso vem da PESSOA, não da empresa: artigo assinado só por
// "Somatec Blocking" vale menos que o mesmo texto revisado por alguém com
// registro profissional.
//
// REGRA DURA: campo vazio NÃO entra no schema. `Person` com `hasCredential: ""`
// ou `jobTitle: ""` é ruído, e credencial inventada pra preencher é justamente
// o que o algoritmo pune em página de segurança. Melhor ausente que falso.
// =============================================================================

export type PessoaSchema = {
  '@type': 'Person';
  name: string;
  jobTitle?: string;
  hasCredential?: string;
  url?: string;
  worksFor: { '@type': 'Organization'; name: string; url: string };
};

export type OrganizacaoSchema = {
  '@type': 'Organization';
  name: string;
};

function limpo(v: string | null | undefined): string {
  return (v ?? '').trim();
}

export function pessoaSchema(
  nome: string | null | undefined,
  extra?: { papel?: string | null; credencial?: string | null },
): PessoaSchema | null {
  const n = limpo(nome);
  if (!n) return null;

  const perfil = autorPorNome(n);
  const papel = limpo(extra?.papel) || limpo(perfil?.papel);
  const credencial = limpo(extra?.credencial) || limpo(perfil?.credencial);

  return {
    '@type': 'Person',
    name: n,
    ...(papel ? { jobTitle: papel } : {}),
    ...(credencial ? { hasCredential: credencial } : {}),
    // Só linka pra página que existe de fato — o redator genérico não tem uma.
    ...(perfil && perfil.slug !== 'redator-somatec'
      ? { url: `${SITE.url}/autor/${perfil.slug}` }
      : {}),
    worksFor: { '@type': 'Organization', name: SITE.fullName, url: SITE.url },
  };
}

/** Quem assina o texto. Sem autoria cadastrada, cai na empresa — que é o que
 *  o site já fazia antes, e é honesto: o artigo é da Somatec. */
export function autorDoArtigo(assinatura?: Assinatura): PessoaSchema | OrganizacaoSchema {
  return pessoaSchema(assinatura?.autor) ?? { '@type': 'Organization', name: SITE.fullName };
}

/** Quem revisou tecnicamente. Sem revisor, o campo simplesmente não existe —
 *  `reviewedBy` apontando pra empresa não prova revisão nenhuma. */
export function revisorDoArtigo(assinatura?: Assinatura): PessoaSchema | null {
  return pessoaSchema(assinatura?.especialista?.nome || assinatura?.revisor, {
    papel: assinatura?.especialista?.papel,
    credencial: assinatura?.especialista?.credencial,
  });
}
