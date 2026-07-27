import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import { Reveal } from '@/components/ui/Reveal';
import { getPostsDoPublico } from '@/lib/constants/blog';
import type { PublicoNI } from '@/lib/constants/publico-clusters';

/**
 * Seção "Blog do público" das LPs NI (R7.5 · C7.5) — artigos filtrados pelo
 * público do visitante.
 *
 * O público vem do CLUSTER do artigo (config única em publico-clusters.ts): o
 * artigo não declara público nenhum. Portão estrutural: só entra artigo COM
 * CORPO e que não seja stub "em preparação" — enquanto não existir nenhum, o
 * componente devolve null e a seção não existe na página. Ela nasce escondida e
 * aparece sozinha quando a redação publicar o 1º artigo do público, sem deploy.
 *
 * 🔒 Regra de ouro NI: nada de locação aqui — os cards levam pro /blog, que é
 * conteúdo, não pra trilha industrial.
 */

type Props = {
  publico: PublicoNI;
  titulo: string;
  subtitulo: string;
};

export function BlogDoPublico({ publico, titulo, subtitulo }: Props) {
  const posts = getPostsDoPublico(publico);
  if (posts.length === 0) return null;

  return (
    /* tone-base: o FAQ acima (R7/C7) é tone-surface e o CTA abaixo é navy —
       ritmo tonal sem dois vizinhos do mesmo tom. */
    <div className="tone-base">
      <section className="container-msm section-y" aria-label="Conteúdo para o seu caso">
        <Reveal className="max-w-3xl space-y-3">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">{titulo}</h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed text-pretty">{subtitulo}</p>
        </Reveal>

        <Reveal delay={80} className="mt-8">
          <div
            className={`grid grid-cols-1 gap-6 ${
              posts.length === 1 ? 'md:max-w-lg' : posts.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
            }`}
          >
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={140} className="mt-8">
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
        </Reveal>
      </section>
    </div>
  );
}
