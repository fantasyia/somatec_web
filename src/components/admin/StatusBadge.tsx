import { cn } from '@/lib/utils';

type Props = {
  status: 'published' | 'draft' | boolean | string;
  trueLabel?: string;
  falseLabel?: string;
};

export function StatusBadge({ status, trueLabel = 'Ativo', falseLabel = 'Inativo' }: Props) {
  const isPositive =
    status === 'published' || status === true || status === 'active' || status === 'sent';
  const isWarning = status === 'pending' || status === 'failed';
  const isDead = status === 'dead';

  const label =
    status === 'published' ? 'Publicado'
    : status === 'draft' ? 'Rascunho'
    : status === 'sent' ? 'Enviado'
    : status === 'pending' ? 'Pendente'
    : status === 'failed' ? 'Com falha'
    : status === 'dead' ? 'Morto'
    : status === true ? trueLabel
    : status === false ? falseLabel
    : String(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        isPositive && !isDead && !isWarning
          ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40'
          : isWarning
          ? 'bg-amber-900/40 text-amber-400 border border-amber-800/40'
          : isDead
          ? 'bg-red-900/40 text-red-400 border border-red-800/40'
          : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-muted))]/80 border border-[rgb(var(--border))]',
      )}
    >
      {label}
    </span>
  );
}
