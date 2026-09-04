import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BlogIndex } from '@/components/blog/BlogIndex';
import { lerPosts } from '@/lib/blog/fonte';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { OFERTA_INDUSTRIAL } from '@/lib/constants/oferta-industrial';

export const metadata: Metadata = {
  title: 'Blog Somatec — proteção elétrica, VTCD e custo de parada',
  description:
    'Artigos técnicos diretos sobre proteção contra surtos, transientes de 100 kHz, VTCD e o custo real das paradas na indústria.',
  alternates: { canonical: '/blog' },
  // Mesma chave do resto do site. Estava CRAVADO em false: virar o
  // SITE_NOINDEX no go-live abriria o site inteiro e deixaria o blog de fora
  // — justamente o motor de SEO, e ninguém perceberia até estranhar que o
  // tráfego orgânico não veio.
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
  openGraph: {
    title: 'Blog Somatec — conteúdo técnico pra quem cuida da planta',
    description: 'Proteção elétrica, VTCD e custo de parada, sem enrolação.',
    url: '/blog',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
};

// Cinco minutos: o artigo passa a vir do CMS, e o índice tem de refletir
// publicação sem esperar deploy. A revalidação sob demanda (/api/blog/revalidar)
// encurta isso pra segundos quando o CMS está ligado.
export const revalidate = 300;

export default async function BlogPage() {
  const posts = await lerPosts();

  return (
    <>
      {/* Topo curto — página de leitura, não de venda */}
      <section className="container-msm pt-28 pb-8 md:pt-32 md:pb-10">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
            <li>
              <Link href="/" className="transition-colors hover:text-cyan">
                Início
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              <span className="text-[rgb(var(--text))]">Blog</span>
            </li>
          </ol>
        </nav>
        <h1 className="font-serif text-h2-m md:text-h1-d font-semibold text-balance">Blog Somatec</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[rgb(var(--text-muted))] md:text-lg text-pretty">
          Proteção elétrica, VTCD e o custo real das paradas — conteúdo técnico direto pra quem
          decide na fábrica.
        </p>
      </section>

      {/* Índice (filtro + paginação) */}
      <section className="container-msm pb-16 md:pb-24" aria-label="Artigos">
        <BlogIndex posts={posts} />
      </section>

      {/* CTA de diagnóstico — banda navy padrão do site */}
      <section className="band-navy text-white" aria-label="Chamada para diagnóstico">
        <div className="container-msm py-14 text-center md:py-20">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Já desconfia que a sua rede tem VTCD?
            </h2>
            <p className="leading-relaxed text-white/80">{OFERTA_INDUSTRIAL.paragrafo}</p>
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
                Falar com a engenharia
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
