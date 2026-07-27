'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

// CTA das LPs NI — rola até a calculadora (#calculadora, smooth global) e emite
// o evento de funil. `variant` cobre os 3 usos: laranja cheio (hero/final),
// ghost claro e ghost sobre navy (cascata).

type Variant = 'primary' | 'ghost' | 'ghostDark';

type Props = {
  label: string;
  event: string;
  setor: string;
  landing: string;
  href?: string;
  variant?: Variant;
};

const CLASSES: Record<Variant, string> = {
  primary: 'btn-primary group',
  ghost:
    'inline-flex items-center gap-1.5 rounded-btn border border-[rgb(var(--border))] px-5 py-2.5 font-sans text-sm font-semibold text-[rgb(var(--text))] transition-colors hover:border-gold hover:text-gold group',
  ghostDark:
    'inline-flex items-center gap-1.5 rounded-btn border border-white/40 px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:border-gold hover:text-gold group',
};

export function LpCta({ label, event, setor, landing, href = '#calculadora', variant = 'primary' }: Props) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent(event, { setor, landing })}
      className={CLASSES[variant]}
    >
      {label}
      <ChevronRight
        className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </Link>
  );
}
