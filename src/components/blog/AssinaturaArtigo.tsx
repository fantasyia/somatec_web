import Link from 'next/link';
import { User, ShieldCheck } from 'lucide-react';
import { autorPorNome } from '@/lib/constants/autores';
import type { Assinatura } from '@/lib/blog/fonte';

// =============================================================================
// Assinatura do artigo — byline no topo e author box no fim.
//
// Regra que vale pros dois: campo vazio NÃO renderiza. Em página YMYL, "bio em
// breve" ou credencial genérica é pior que ausência — o Google lê texto de
// enfeite como sinal de conteúdo sem dono real.
//
// Quem escreve e quem revisa são pessoas DIFERENTES de propósito: a redação
// assina o texto, o especialista assina a checagem técnica. Se vierem iguais,
// a linha de revisão some em vez de repetir o nome.
// =============================================================================

function nomeIgual(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const n = (v: string) =>
    v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return n(a) === n(b);
}

/** Nome + link pra página do autor, quando ela existe. */
function NomeDoAutor({ nome }: { nome: string }) {
  const perfil = autorPorNome(nome);
  if (!perfil || perfil.slug === 'redator-somatec') {
    return <span className="font-semibold text-[rgb(var(--text))]">{nome}</span>;
  }
  return (
    <Link
      href={`/autor/${perfil.slug}`}
      className="font-semibold text-[rgb(var(--text))] underline decoration-cyan/40 underline-offset-4 transition-colors hover:text-cyan"
    >
      {nome}
    </Link>
  );
}

/** Linha curta abaixo do título. */
export function BylineArtigo({ assinatura }: { assinatura?: Assinatura }) {
  if (!assinatura?.autor) return null;
  const mostraRevisor =
    Boolean(assinatura.revisor) && !nomeIgual(assinatura.revisor, assinatura.autor);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-sm text-[rgb(var(--text-muted))]">
      <span className="inline-flex items-center gap-1.5">
        <User className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        Escrito por <NomeDoAutor nome={assinatura.autor} />
      </span>
      {mostraRevisor && (
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan" strokeWidth={1.75} aria-hidden="true" />
          Revisado por <NomeDoAutor nome={assinatura.revisor!} />
        </span>
      )}
    </div>
  );
}

/** Caixa do fim do artigo: quem revisou tecnicamente, com credencial e bio. */
export function AuthorBox({ assinatura }: { assinatura?: Assinatura }) {
  if (!assinatura) return null;

  // O author box é sobre a AUTORIDADE TÉCNICA. Quem sustenta o artigo em YMYL
  // é o revisor especialista; sem ele, a caixa não tem o que provar.
  const nome = assinatura.especialista?.nome || assinatura.revisor;
  if (!nome) return null;

  const perfil = autorPorNome(nome);
  const papel = assinatura.especialista?.papel || perfil?.papel || '';
  const credencial = assinatura.especialista?.credencial || perfil?.credencial || '';
  const bio = assinatura.especialista?.bio || perfil?.bio || '';
  const foto = perfil?.foto ?? null;

  return (
    <aside
      className="mt-12 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 md:p-6"
      aria-label="Sobre quem revisou este artigo"
    >
      <p className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">
        Revisão técnica
      </p>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt={nome} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <User className="h-6 w-6 text-[rgb(var(--text-muted))]" strokeWidth={1.5} aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-serif text-lg font-semibold text-[rgb(var(--text))]">
            {perfil && perfil.slug !== 'redator-somatec' ? (
              <Link
                href={`/autor/${perfil.slug}`}
                className="underline decoration-cyan/40 underline-offset-4 transition-colors hover:text-cyan"
              >
                {nome}
              </Link>
            ) : (
              nome
            )}
          </p>
          {papel && <p className="font-sans text-sm text-[rgb(var(--text-muted))]">{papel}</p>}
          {credencial && (
            <p className="mt-0.5 font-sans text-sm font-medium text-cyan">{credencial}</p>
          )}
          {bio && (
            <p className="mt-2 text-[15px] leading-relaxed text-[rgb(var(--text))]">{bio}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
