import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';

type Breadcrumb = { label: string; href?: string };

type PlaceholderPageProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  comingSoonNote?: string;
};

export function PlaceholderPage({
  title,
  description,
  breadcrumbs,
  comingSoonNote,
}: PlaceholderPageProps) {
  return (
    <>
      {/* Compact hero */}
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

          <div className="max-w-3xl space-y-5">
            <h1 className="font-serif font-semibold text-h2-m md:text-h1-d text-balance">
              {title}
            </h1>
            {description && (
              <p className="text-base md:text-lg leading-relaxed text-white/80 max-w-2xl text-pretty">
                {description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container-msm py-12 md:py-16">
        <div className="rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 md:p-12 max-w-3xl mx-auto">
          <span className="placeholder-tag mb-6">Conteúdo em preparação</span>
          <h2 className="font-serif text-h3-d font-semibold mb-4 text-balance">
            Esta página está sendo preparada
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed mb-6 text-pretty">
            {comingSoonNote ??
              'Esta seção será atualizada em breve com o conteúdo completo.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-gold hover:text-gold-soft transition-colors"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Voltar para a home
          </Link>
        </div>
      </section>
    </>
  );
}
