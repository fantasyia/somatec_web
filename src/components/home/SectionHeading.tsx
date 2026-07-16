import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type SectionHeadingProps = {
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  align?: 'left' | 'center';
};

export function SectionHeading({
  title,
  description,
  viewAllHref,
  viewAllLabel = 'Ver todos',
  align = 'left',
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col gap-4 mb-6 md:mb-8 ${
        align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      }`}
    >
      <div className={`max-w-2xl space-y-3 ${align === 'center' ? 'mx-auto' : ''}`}>
        <h2 className="font-serif font-semibold text-h2-m md:text-h2-d text-balance leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-base md:text-lg leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
            {description}
          </p>
        )}
      </div>
      {viewAllHref && align !== 'center' && (
        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-sans font-semibold text-gold hover:text-gold-soft transition-colors whitespace-nowrap"
        >
          {viewAllLabel}
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform duration-200 ease-premium group-hover:translate-x-1"
            strokeWidth={2}
          />
        </Link>
      )}
    </div>
  );
}
