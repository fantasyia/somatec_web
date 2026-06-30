import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';

// =============================================================================
// RecipeCard — card de receita editorial (Adendo v1.1 §20.10).
// Imagem com gradient overlay no bottom (sempre visível, intensifica no hover),
// eyebrow de categoria sobre a foto, hover scale 1.04.
// =============================================================================

export type RecipeCardData = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  image_url: string | null;
  total_time: string | null;
  /** Categoria p/ eyebrow sobre a imagem. Omitido se null. */
  categoryName?: string | null;
};

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  return (
    <Link
      href={`/receitas/${recipe.slug}`}
      className="group flex flex-col rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden transition-all duration-[250ms] ease-premium hover:-translate-y-0.5 hover:border-gold hover:shadow-premium-light dark:hover:shadow-premium-dark"
    >
      <div className="aspect-video relative bg-[rgb(var(--border))] overflow-hidden">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-[400ms] ease-premium"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[rgb(var(--text-muted))]">
            Imagem em breve
          </div>
        )}

        {/* Gradient overlay base — sempre visível, dá legibilidade ao eyebrow */}
        <div
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[rgba(7,27,51,0.6)] via-[rgba(7,27,51,0.15)] to-transparent"
          aria-hidden="true"
        />
        {/* Camada de hover — cross-fade pra um navy mais intenso (300ms) */}
        <div
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[rgba(7,27,51,0.75)] via-[rgba(7,27,51,0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-premium"
          aria-hidden="true"
        />

        {/* Eyebrow categoria sobre a imagem */}
        {recipe.categoryName && (
          <span className="absolute bottom-3 left-4 z-10 text-[11px] font-sans font-semibold uppercase tracking-[0.06em] text-gold-soft">
            {recipe.categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-6 flex-1">
        <h2 className="font-sans font-semibold text-[rgb(var(--text))] leading-snug">{recipe.title}</h2>
        {recipe.short_description && (
          <p className="text-xs leading-relaxed text-[rgb(var(--text-muted))] line-clamp-2">
            {recipe.short_description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          {recipe.total_time && (
            <span className="inline-flex items-center gap-1 text-xs text-[rgb(var(--text-muted))]">
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              {recipe.total_time}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-semibold text-gold ml-auto">
            Ver receita
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}
