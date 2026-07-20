import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock, Zap } from 'lucide-react';
import { ArticleToc } from '@/components/blog/ArticleToc';
import { BlogCard } from '@/components/blog/BlogCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getBlogPosts, getPostBySlug, type BlogPost } from '@/lib/constants/blog';
import { getArticleContent } from '@/lib/constants/blog-content';
import { SITE, DEFAULT_OG_IMAGES } from '@/lib/constants/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.titulo} | Blog Somatec`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: { index: false, follow: true },
    openGraph: {
      title: post.titulo,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      type: 'article',
      images: post.heroUrl ? [`${SITE.url}${post.heroUrl}`] : [...DEFAULT_OG_IMAGES],
    },
  };
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getRelated(post: BlogPost): BlogPost[] {
  const others = getBlogPosts().filter((p) => p.slug !== post.slug);
  const sameCluster = others.filter((p) => p.cluster === post.cluster);
  return [...sameCluster, ...others.filter((p) => p.cluster !== post.cluster)].slice(0, 3);
}

export const revalidate = 3600;

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const content = getArticleContent(slug);
  const related = getRelated(post);
  const tocItems = content?.secoes.map((s) => ({ id: s.id, titulo: s.titulo })) ?? [];
  const absUrl = `${SITE.url}/blog/${post.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.titulo,
      description: post.excerpt,
      image: post.heroUrl ? `${SITE.url}${post.heroUrl}` : SITE.ogImage,
      datePublished: post.publicadoEm,
      dateModified: content?.atualizadoEm ?? post.publicadoEm,
      author: { '@type': 'Organization', name: SITE.fullName },
      publisher: {
        '@type': 'Organization',
        name: SITE.fullName,
        logo: { '@type': 'ImageObject', url: `${SITE.url}/logo-somatec.png` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE.url}/blog` },
        { '@type': 'ListItem', position: 3, name: post.titulo, item: absUrl },
      ],
    },
    ...(content && content.faq.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: content.faq.map((f) => ({
              '@type': 'Question',
              name: f.pergunta,
              acceptedAnswer: { '@type': 'Answer', text: f.resposta },
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Cabeçalho do artigo */}
      <section className="container-msm pt-28 md:pt-32">
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
              <span>{post.cluster}</span>
            </li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <h1 className="font-serif text-h2-m md:text-h1-d font-semibold text-balance leading-tight">
            {post.titulo}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-[rgb(var(--text-muted))]">
            <span className="inline-flex items-center rounded-full bg-cyan/10 px-2.5 py-1 text-[11px] font-semibold text-cyan">
              {post.cluster}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {post.tempoLeitura} min de leitura
            </span>
            <span>
              {formatDate(post.publicadoEm)}
              {content?.atualizadoEm && content.atualizadoEm !== post.publicadoEm
                ? ` · atualizado em ${formatDate(content.atualizadoEm)}`
                : ''}
            </span>
          </div>

          {/* Resposta rápida (featured snippet) */}
          {content?.respostaRapida && (
            <div className="mt-6 rounded-card-lg border border-cyan/30 bg-cyan/5 p-5 md:p-6">
              <div className="mb-1.5 font-sans text-sm font-bold text-cyan">Resposta rápida</div>
              <p className="text-[15px] leading-relaxed text-[rgb(var(--text))]">
                {content.respostaRapida}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Hero */}
      {post.heroUrl && (
        <section className="container-msm mt-8">
          <div className="relative aspect-video w-full overflow-hidden rounded-card-lg border border-[rgb(var(--border))]">
            <Image
              src={post.heroUrl}
              alt={post.titulo}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1000px"
              className="object-cover"
            />
          </div>
        </section>
      )}

      {/* Corpo + lateral */}
      <section className="container-msm py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* Coluna principal */}
          <article className="max-w-[68ch]">
            {content ? (
              content.secoes.map((sec) => (
                <div key={sec.id}>
                  <h2
                    id={sec.id}
                    className="scroll-mt-28 font-serif text-2xl font-semibold text-[rgb(var(--text))] mt-10 mb-3 first:mt-0"
                  >
                    {sec.titulo}
                  </h2>
                  {sec.paragrafos.map((p, i) => (
                    <p key={i} className="mb-4 text-[17px] leading-[1.85] text-[rgb(var(--text))]">
                      {p}
                    </p>
                  ))}
                  {sec.subsecoes?.map((sub, i) => (
                    <div key={i}>
                      <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))] mt-6 mb-2">
                        {sub.titulo}
                      </h3>
                      {sub.paragrafos.map((p, j) => (
                        <p key={j} className="mb-4 text-[17px] leading-[1.85] text-[rgb(var(--text))]">
                          {p}
                        </p>
                      ))}
                    </div>
                  ))}
                  {sec.imagem && (
                    <figure className="my-6">
                      <div className="relative aspect-video w-full overflow-hidden rounded-card border border-[rgb(var(--border))]">
                        <Image
                          src={sec.imagem.url}
                          alt={sec.imagem.alt}
                          fill
                          sizes="(max-width: 1024px) 100vw, 700px"
                          className="object-cover"
                        />
                      </div>
                      <figcaption className="mt-2 text-sm text-[rgb(var(--text-muted))]">
                        {sec.imagem.legenda}
                      </figcaption>
                    </figure>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[17px] leading-[1.85] text-[rgb(var(--text-muted))]">
                {post.excerpt}
              </p>
            )}

            {/* FAQ */}
            {content && content.faq.length > 0 && (
              <div className="mt-12">
                <h2 className="font-serif text-2xl font-semibold text-[rgb(var(--text))] mb-4">
                  Perguntas frequentes
                </h2>
                <div className="divide-y divide-[rgb(var(--border))] border-y border-[rgb(var(--border))]">
                  {content.faq.map((f) => (
                    <details key={f.pergunta} className="group py-4">
                      <summary className="cursor-pointer font-sans font-semibold text-[rgb(var(--text))]">
                        {f.pergunta}
                      </summary>
                      <p className="mt-2 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                        {f.resposta}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Lateral: TOC + CTA discreto */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <ArticleToc items={tocItems} />
            <div className="mt-6 card-elevated p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-btn bg-gold/10 text-gold">
                  <Zap className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="font-sans text-sm font-bold text-[rgb(var(--text))]">
                  Diagnóstico sem custo
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-[rgb(var(--text-muted))]">
                Meça a VTCD na sua rede. Você só paga se o resultado for comprovado na sua planta.
              </p>
              <Link
                href="/ferramentas/custo-de-parada"
                className="mt-3 inline-flex items-center gap-1 font-sans text-sm font-semibold text-cyan transition-colors hover:text-cyan/80"
              >
                Calcular meu prejuízo
                <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* CTA final — banda navy padrão do site */}
      <section className="band-navy text-white" aria-label="Chamada para diagnóstico">
        <div className="container-msm py-14 text-center md:py-20">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Descubra se a sua planta sofre com VTCD
            </h2>
            <p className="leading-relaxed text-white/80">
              A medição na sua rede é sem custo. Você só passa a pagar se o resultado for comprovado
              na sua própria operação.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/ferramentas/custo-de-parada" className="btn-primary group">
                Calcular meu prejuízo
                <ChevronRight
                  className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center rounded-btn border border-white/40 px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:border-gold hover:text-gold"
              >
                Solicitar diagnóstico
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="container-msm py-14 md:py-20" aria-label="Artigos relacionados">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold mb-8">Leia também</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
