import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Breadcrumb = { label: string; href?: string };

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
};

export function PageHeader({ title, description, breadcrumbs, action }: Props) {
  return (
    <div className="border-b border-[rgb(var(--border))] px-6 py-5 lg:px-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 mb-2 flex-wrap">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-white/20" strokeWidth={2} />}
                {b.href ? (
                  <Link href={b.href} className="text-xs text-[rgb(var(--text-muted))]/80 hover:text-white/70 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-xs text-[rgb(var(--text-muted))]">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-lg font-semibold text-[rgb(var(--text))] truncate">{title}</h1>
        {description && (
          <p className="text-sm text-[rgb(var(--text-muted))]/80 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
