import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// =============================================================================
// ProductCard — card de produto editorial premium (Adendo v1.1 §20.9).
// Aspect 4:5, eyebrow da marca, meta da embalagem primária.
// Reutilizado em /produtos e nos filtros (categoria/aplicação/marca).
// =============================================================================

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  main_image_url: string | null;
  /** Nome da marca p/ eyebrow. Omitido se null. */
  brandName?: string | null;
  /** Meta já formatada da embalagem primária (ex: "Pouch · 2 kg"). Omitido se null. */
  packaging?: string | null;
};

type PackagingOption = {
  label: string | null;
  weight_or_volume: string | null;
  is_primary: boolean;
};

/** Escolhe a embalagem primária (is_primary, senão a 1ª) e formata "label · peso". */
export function formatPrimaryPackaging(opts: PackagingOption[] | null | undefined): string | null {
  if (!opts || opts.length === 0) return null;
  const primary = opts.find((o) => o.is_primary) ?? opts[0];
  if (!primary) return null;
  const parts = [primary.label, primary.weight_or_volume].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden transition-all duration-[250ms] ease-premium hover:-translate-y-0.5 hover:border-gold hover:shadow-premium-light dark:hover:shadow-premium-dark"
    >
      <div className="aspect-[4/5] relative bg-[rgb(var(--border))] overflow-hidden">
        {product.main_image_url ? (
          <Image
            src={product.main_image_url}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-[400ms]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-[rgb(var(--text-muted))]">Imagem em breve</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-5 flex-1">
        {product.brandName && (
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.06em] text-gold">
            {product.brandName}
          </span>
        )}
        <h2 className="font-sans font-semibold text-[rgb(var(--text))] leading-snug">{product.name}</h2>
        {product.packaging && (
          <p className="text-[13px] text-[rgb(var(--text-muted))]">{product.packaging}</p>
        )}
        {product.short_description && (
          <p className="text-xs leading-relaxed text-[rgb(var(--text-muted))] line-clamp-2">
            {product.short_description}
          </p>
        )}
        <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-gold pt-1">
          Ver produto
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}
