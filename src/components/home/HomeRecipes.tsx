import Image from 'next/image';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import type { Recipe } from '@/types/database';

type Props = { recipes: Recipe[] };

export function HomeRecipes({ recipes }: Props) {
  if (recipes.length === 0) return null;

  return (
    <section
      className="bg-[rgb(var(--surface))] border-y border-[rgb(var(--border))]"
      aria-label="Receitas em destaque"
    >
      <div className="container-msm py-12 md:py-16">
        <SectionHeading
          eyebrow="Receitas"
          title="Receitas em destaque"
          description="Inspirações com aplicação prática usando produtos MSM."
          viewAllHref="/receitas"
          viewAllLabel="Ver todas"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/receitas/${recipe.slug}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[4/3] rounded-card-lg overflow-hidden mb-5 bg-navy-700">
                {recipe.image_url ? (
                  <Image
                    src={recipe.image_url}
                    alt={recipe.title}
                    fill
                    className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-end p-6"
                    style={{
                      background:
                        'linear-gradient(135deg, rgb(13,41,73) 0%, rgb(7,27,51) 60%, rgb(3,17,31) 100%)',
                    }}
                  >
                    <span className="font-serif text-white/20 text-3xl">{recipe.title}</span>
                  </div>
                )}
                {/* Gradient overlay editorial */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-premium"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(3,17,31,0.7) 100%)',
                  }}
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-2 px-1">
                <span className="text-[11px] uppercase tracking-widest font-semibold text-gold">
                  Receita
                </span>
                <h3 className="font-sans font-semibold text-lg md:text-xl text-[rgb(var(--text))] group-hover:text-gold transition-colors text-balance">
                  {recipe.title}
                </h3>
                {recipe.total_time && (
                  <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {recipe.total_time}
                  </div>
                )}
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-sans font-semibold text-[rgb(var(--text-muted))] group-hover:text-gold transition-colors">
                  Ver receita
                  <ChevronRight
                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
