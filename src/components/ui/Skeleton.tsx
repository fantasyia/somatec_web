import { cn } from '@/lib/utils';

// =============================================================================
// Skeleton — placeholder de carregamento com shimmer (Adendo v1.1 §20.15).
// Substitui spinners genéricos. O keyframe `shimmer` já existe no
// tailwind.config (animate-shimmer: move backgroundPosition -1000px → 1000px).
//
// Server component (sem 'use client') — pode ser usado em loading.tsx.
// =============================================================================

type Variant = 'text' | 'title' | 'card' | 'avatar' | 'image';

type Props = {
  /** Forma do placeholder. Default: 'text'. */
  variant?: Variant;
  /** Aspect ratio para variant='image' (ex: '4/5', '4/3', '1/1'). Default '4/5'. */
  ratio?: string;
  /** Classes extras / overrides pontuais. */
  className?: string;
};

// Shimmer: gradient horizontal animado sobre surface elevada.
const SHIMMER =
  'animate-shimmer bg-[length:1000px_100%] ' +
  'bg-[linear-gradient(90deg,rgb(var(--surface))_0%,rgb(var(--surface-elevated))_50%,rgb(var(--surface))_100%)]';

const VARIANT_CLASS: Record<Variant, string> = {
  text: 'h-4 w-full rounded',
  title: 'h-8 w-2/3 rounded-md',
  card: 'h-full w-full rounded-card',
  avatar: 'h-12 w-12 rounded-full',
  image: 'w-full rounded-card', // aspect aplicado via style inline
};

export function Skeleton({ variant = 'text', ratio = '4/5', className }: Props) {
  const isImage = variant === 'image';
  return (
    <div
      aria-hidden="true"
      style={isImage ? { aspectRatio: ratio.replace('/', ' / ') } : undefined}
      className={cn(SHIMMER, VARIANT_CLASS[variant], className)}
    />
  );
}
