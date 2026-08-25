import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, User } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE, DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { autorPorSlug, autoresComPagina, autorPorNome } from '@/lib/constants/autores';
import { lerAcervo } from '@/lib/blog/fonte';

// =============================================================================
// Página do autor — a prova de que quem assina o artigo é uma pessoa real.
//
// Em YMYL o Google segue o link do author box até aqui. Uma página que só
// repete o nome não ajuda; o que sustenta é cargo, credencial e o histórico do
// que a pessoa assinou. Por isso a lista de artigos é o corpo da página, e não
// um apêndice.
//
// Campo vazio não vira texto de enfeite: sem bio, a página mostra o que tem.
// =============================================================================

export const revalidate = 300;

export function generateStaticParams() {
  return autoresComPagina().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const autor = autorPorSlug(slug);
  if (!autor) return {};
  const descricao = autor.bio || `${autor.papel} — artigos assinados e revisados no blog da ${SITE.fullName}.`;
  return {
    title: `${autor.nome} | Blog Somatec`,
    description: descricao,
    alternates: { canonical: `/autor/${autor.slug}` },
    robots: { index: false, follow: true },
    openGraph: {
      title: autor.nome,
      description: descricao,
      url: `/autor/${autor.slug}`,
      type: 'profile',
      images: [...DEFAULT_OG_IMAGES],
    },
  };
}

export default async function AutorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const autor = autorPorSlug(slug);
  if (!autor || autor.slug === 'redator-somatec') notFound();

  const acervo = await lerAcervo();

  // Escreveu OU revisou — as duas coisas contam como autoria pro E-E-A-T.
  const artigos = acervo.posts.filter((p) => {
    const a = acervo.assinaturas.get(p.slug);
    if (!a) return false;
    return (
      autorPorNome(a.autor)?.slug === autor.slug ||
      autorPorNome(a.revisor)?.slug === autor.slug ||
      autorPorNome(a.especialista?.nome)?.slug === autor.slug
    );
  });

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: autor.nome,
        ...(autor.papel ? { jobTitle: autor.papel } : {}),
        ...(autor.credencial ? { hasCredential: autor.credencial } : {}),
        ...(autor.bio ? { description: autor.bio } : {}),
        url: `${SITE.url}/autor/${autor.slug}`,
        worksFor: { '@type': 'Organization', name: SITE.fullName, url: SITE.url },
      },
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="container-msm pt-28 pb-8 md:pt-32">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
            <li>
              <Link href="/" className="transition-colors hover:text-cyan">
                Início
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              <Link href="/blog" className="transition-colors hover:text-cyan">
                Blog
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              <span className="text-[rgb(var(--text))]">{autor.nome}</span>
            </li>
          </ol>
        </nav>

        <div className="flex max-w-3xl flex-col gap-5 md:flex-row md:items-start md:gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            {autor.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={autor.foto} alt={autor.nome} className="h-full w-full object-cover" />
            ) : (
              <User className="h-9 w-9 text-[rgb(var(--text-muted))]" strokeWidth={1.5} aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-h2-m md:text-h2-d font-semibold leading-tight">
              {autor.nome}
            </h1>
            {autor.papel && (
              <p className="mt-1.5 font-sans text-[rgb(var(--text-muted))]">{autor.papel}</p>
            )}
            {autor.credencial && (
              <p className="mt-1 font-sans text-sm font-semibold text-cyan">{autor.credencial}</p>
            )}
            {autor.bio && (
              <p className="mt-4 text-[17px] leading-[1.8] text-[rgb(var(--text))]">{autor.bio}</p>
            )}
          </div>
        </div>
      </section>

      <section className="container-msm pb-16 md:pb-20">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-[rgb(var(--text))]">
          {artigos.length > 0
            ? `Artigos assinados por ${autor.nome.split(' ')[0]}`
            : 'Artigos'}
        </h2>

        {artigos.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {artigos.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        ) : (
          <p className="text-[rgb(var(--text-muted))]">
            Nenhum artigo publicado com esta assinatura ainda.
          </p>
        )}
      </section>
    </>
  );
}
