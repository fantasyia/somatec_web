'use client';

import type { ElementType, ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

// =============================================================================
// Reveal — entrada animada ao scroll (Adendo v1.1 §20.14).
// opacity 0 → 1 + translateY(16px → 0) em 600ms ease-out quando entra no
// viewport. `delay` cria stagger entre filhos.
//
// prefers-reduced-motion: as classes motion-reduce:* forçam o estado final
// sem transição (independente do JS), garantindo conteúdo sempre visível.
// =============================================================================

type Props = {
  children: ReactNode;
  /** Atraso em ms p/ stagger entre elementos. Default 0. */
  delay?: number;
  /** Tag semântica do wrapper. Default 'div'. */
  as?: ElementType;
  className?: string;
};

export function Reveal({ children, delay = 0, as: Tag = 'div', className }: Props) {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-[600ms] ease-out will-change-[opacity,transform]',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        // Reduced motion: estado final imediato, sem animação.
        'motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:!transition-none',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
