import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';

export default function Loading() {
  return (
    <div className="flex-1">
      <div className="bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))]">
        <div className="container-msm py-12 md:py-16 space-y-4">
          <Skeleton variant="text" className="h-3 w-20" />
          <Skeleton variant="title" className="h-10 w-1/3" />
          <Skeleton variant="text" className="h-4 w-2/3 max-w-xl" />
        </div>
      </div>
      <div className="container-msm py-10 md:py-14">
        {/* chips de categoria */}
        <div className="flex flex-wrap gap-2 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-7 w-28 rounded-btn" />
          ))}
        </div>
        <SkeletonCardGrid
          count={6}
          ratio="16/9"
          columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>
    </div>
  );
}
