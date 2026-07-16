'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import { BLOG_CLUSTERS, type BlogPost } from '@/lib/constants/blog';

const PAGE_SIZE = 6;
const FILTERS = ['Todos', ...BLOG_CLUSTERS] as const;

/**
 * Índice do blog — filtro por cluster + paginação, tudo client-side (por
 * enquanto). Reusa o BlogCard do teaser da home (mesma família visual).
 */
export function BlogIndex({ posts }: { posts: BlogPost[] }) {
  const [cluster, setCluster] = useState<string>('Todos');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => (cluster === 'Todos' ? posts : posts.filter((p) => p.cluster === cluster)),
    [cluster, posts],
  );

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = rest.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function selectCluster(c: string) {
    setCluster(c);
    setPage(1);
  }

  return (
    <div>
      {/* Filtro por cluster */}
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por assunto">
        {FILTERS.map((f) => {
          const active = cluster === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => selectCluster(f)}
              aria-pressed={active}
              className={`rounded-full px-3.5 py-1.5 font-sans text-sm font-semibold transition-colors ${
                active
                  ? 'bg-cyan text-white'
                  : 'border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:border-cyan hover:text-cyan'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-[rgb(var(--text-muted))]">
          Nenhum artigo neste assunto ainda.
        </p>
      ) : (
        <>
          {/* Destaque */}
          {featured && (
            <div className="mb-8">
              <BlogCard post={featured} variant="featured" orientation="horizontal" priority />
            </div>
          )}

          {/* Grid 3 colunas */}
          {pageItems.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Paginação">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
                className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] transition-colors hover:border-cyan hover:text-cyan disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? 'page' : undefined}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-btn px-3 font-sans text-sm font-semibold transition-colors ${
                    n === currentPage
                      ? 'bg-cyan text-white'
                      : 'border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:border-cyan hover:text-cyan'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Próxima página"
                className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] transition-colors hover:border-cyan hover:text-cyan disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
