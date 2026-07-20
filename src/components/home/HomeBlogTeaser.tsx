import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import { getTeaserPosts } from '@/lib/constants/blog';

/**
 * Bloco 11 da home — teaser do blog. Válvula de escape de quem ainda NÃO está
 * pronto pro diagnóstico: por isso fica depois de todas as tentativas de conversão.
 * Data-driven (getTeaserPosts). Renderizado só quando BLOG_TEASER_ENABLED (page.tsx).
 * Disciplina de marca: zero laranja aqui — laranja é exclusivo de MB/CTA de diagnóstico.
 */
export function HomeBlogTeaser() {
  const posts = getTeaserPosts();
  if (posts.length < 3) return null;
  const [featured, ...rest] = posts;

  return (
    <section className="container-msm section-y" aria-label="Conteúdo técnico do blog">
      <div className="mb-8 max-w-3xl md:mb-10">
        <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance leading-tight">
          Conteúdo técnico pra quem cuida da planta
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[rgb(var(--text-muted))] md:text-lg text-pretty">
          Artigos diretos sobre proteção elétrica, VTCD e o custo real das paradas — sem
          enrolação, pra quem decide na fábrica.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BlogCard post={featured} variant="featured" />
        <div className="flex flex-col gap-6">
          {rest.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center md:justify-start">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-1.5 rounded-btn border border-cyan px-5 py-2.5 font-sans text-sm font-semibold text-cyan transition-colors hover:bg-cyan/10"
        >
          Ver todos os artigos
          <ChevronRight
            className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </Link>
      </div>
    </section>
  );
}
