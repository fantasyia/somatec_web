import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// EmptyState — estado vazio desenhado (Adendo v1.1 §20.15).
// Substitui texto plano "Nenhum registro encontrado".
// =============================================================================

type Props = {
  /** Ícone Lucide (componente, não elemento). */
  icon: LucideIcon;
  title: string;
  description?: string;
  /** CTA opcional (botão, link). */
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 md:py-16 px-6',
        className,
      )}
    >
      <Icon
        className="h-12 w-12 text-[rgb(var(--text-muted))]/50 mb-5"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="font-sans text-lg md:text-xl font-semibold text-[rgb(var(--text))]">
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[rgb(var(--text-muted))]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
