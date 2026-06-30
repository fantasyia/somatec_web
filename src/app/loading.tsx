import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';

// Loading global (Suspense fallback de rota). Composição de skeletons que
// reflete a estrutura padrão: PageHero + grid (Adendo v1.1 §20.15 — sem
// spinner genérico).
export default function Loading() {
  return (
    <div className="flex-1">
      {/* PageHero skeleton */}
      <div className="bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))]">
        <div className="container-msm py-12 md:py-16 space-y-4">
          <Skeleton variant="text" className="h-3 w-24" />
          <Skeleton variant="title" className="h-10 w-1/2" />
          <Skeleton variant="text" className="h-4 w-2/3 max-w-xl" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="container-msm py-10 md:py-14">
        <SkeletonCardGrid count={8} />
      </div>
    </div>
  );
}
