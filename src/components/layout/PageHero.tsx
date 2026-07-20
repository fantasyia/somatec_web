import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

type Breadcrumb = { label: string; href?: string };

type PageHeroProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode;
};

export function PageHero({ title, description, breadcrumbs, children }: PageHeroProps) {
  return (
    <section
      className="relative pt-28 pb-10 md:pt-32 md:pb-14 bg-deep_navy text-white overflow-hidden"
      aria-label="Cabeçalho da página"
    >
      <div className="container-msm relative">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              <li>
                <Link href="/" className="hover:text-gold transition-colors">
                  Início
                </Link>
              </li>
              {breadcrumbs.map((bc, i) => (
                <li key={`${bc.label}-${i}`} className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-gold transition-colors">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="text-white/85">{bc.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <Reveal className="max-w-3xl space-y-5">
          <h1 className="font-serif font-semibold text-h2-m md:text-h1-d text-balance">
            {title}
          </h1>
          {description && (
            <p className="text-base md:text-lg leading-relaxed text-white/80 max-w-2xl text-pretty">
              {description}
            </p>
          )}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
