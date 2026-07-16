'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

type TocItem = { id: string; titulo: string };

/**
 * Índice do artigo, gerado dos H2. Sticky na lateral (desktop) e colapsável
 * (<details>) no mobile. Scrollspy destaca a seção atual. Um só observer.
 */
export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const list = (
    <ol className="space-y-2 text-sm">
      {items.map(({ id, titulo }) => (
        <li key={id}>
          <a
            href={`#${id}`}
            className={`block border-l-2 pl-3 leading-snug transition-colors ${
              active === id
                ? 'border-cyan font-semibold text-cyan'
                : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-cyan'
            }`}
          >
            {titulo}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      {/* Mobile — colapsável */}
      <details className="mb-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 lg:hidden">
        <summary className="flex cursor-pointer items-center gap-2 font-sans text-sm font-semibold text-[rgb(var(--text))]">
          <List className="h-4 w-4 text-cyan" strokeWidth={2} aria-hidden="true" />
          Neste artigo
        </summary>
        <div className="mt-4">{list}</div>
      </details>

      {/* Desktop — sticky */}
      <nav aria-label="Índice do artigo" className="hidden lg:block">
        <div className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold text-[rgb(var(--text))]">
          <List className="h-4 w-4 text-cyan" strokeWidth={2} aria-hidden="true" />
          Neste artigo
        </div>
        {list}
      </nav>
    </>
  );
}
