import { Skeleton } from './Skeleton';
import { cn } from '@/lib/utils';

// =============================================================================
// SkeletonCard — placeholder que mimica a estrutura de card de
// produto/receita/marca nos listings. Usado em loading.tsx das rotas.
// =============================================================================

type Props = {
  /** Aspect ratio da imagem. '4/5' produto (default), '4/3' receita. */
  ratio?: string;
  className?: string;
};

export function SkeletonCard({ ratio = '4/5', className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden',
        className,
      )}
    >
      <Skeleton variant="image" ratio={ratio} className="rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-2/3" />
        <Skeleton variant="text" className="h-3 w-24 mt-1" />
      </div>
    </div>
  );
}

/** Grade de SkeletonCards — mesma malha responsiva dos listings. */
export function SkeletonCardGrid({
  count = 8,
  ratio = '4/5',
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: {
  count?: number;
  ratio?: string;
  columns?: string;
}) {
  return (
    <div className={cn('grid gap-5', columns)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} ratio={ratio} />
      ))}
    </div>
  );
}
