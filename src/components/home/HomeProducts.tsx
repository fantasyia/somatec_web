'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import type { Product } from '@/types/database';

type Props = { products: Product[]; brandNames: Record<string, string> };

export function HomeProducts({ products, brandNames }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = card ? card.offsetWidth + 24 : 320;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="container-msm py-12 md:py-16" aria-label="Produtos em destaque">
      <SectionHeading
        title="Do pequeno comércio à indústria pesada"
        description="Modelos MB-01 a MB-12, dimensionados pela máxima corrente de surto da sua planta."
        viewAllHref="/produtos"
        viewAllLabel="Ver todos"
      />

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 -mx-6 px-6 scrollbar-thin"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(var(--border)) transparent',
          }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              data-card
              href={`/produtos/${product.slug}`}
              className="group flex-shrink-0 w-[260px] md:w-[300px] snap-start"
            >
              <div className="relative aspect-[4/5] rounded-card-lg overflow-hidden bg-off_white dark:bg-navy-700 border border-[rgb(var(--border))] mb-4 transition-all duration-[250ms] ease-premium group-hover:border-gold group-hover:shadow-premium-light dark:group-hover:shadow-premium-dark">
                {product.main_image_url ? (
                  <Image
                    src={product.main_image_url}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 260px, 300px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center p-8">
                    <span className="font-serif text-3xl text-[rgb(var(--text-muted))] opacity-30 text-center">
                      {product.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 px-1">
                {product.brand_id && brandNames[product.brand_id] && (
                  <span className="text-[11px] font-semibold text-gold">
                    {brandNames[product.brand_id]}
                  </span>
                )}
                <h3 className="font-sans font-semibold text-base md:text-lg text-[rgb(var(--text))] group-hover:text-gold transition-colors">
                  {product.name}
                </h3>
                {product.packaging_summary && (
                  <p className="text-xs text-[rgb(var(--text-muted))]">{product.packaging_summary}</p>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-[rgb(var(--text-muted))] group-hover:text-gold transition-colors">
                  Saiba mais
                  <ChevronRight
                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {products.length > 3 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => scrollBy(-1)}
              className="hidden md:flex absolute -left-2 top-[42%] -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text))] opacity-50 hover:opacity-100 hover:border-gold transition-all duration-200 ease-premium z-10"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Próximo"
              onClick={() => scrollBy(1)}
              className="hidden md:flex absolute -right-2 top-[42%] -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text))] opacity-50 hover:opacity-100 hover:border-gold transition-all duration-200 ease-premium z-10"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
