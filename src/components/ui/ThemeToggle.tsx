'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ transparent = false }: { transparent?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- pattern de hydration recomendado pelo next-themes
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={
        transparent
          ? 'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition-all duration-200 ease-premium hover:border-white hover:text-gold'
          : 'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-transparent text-[rgb(var(--text))] transition-all duration-200 ease-premium hover:border-gold hover:text-gold'
      }
    >
      <span className="sr-only">Alternar tema</span>
      <Sun
        className={`h-4 w-4 absolute transition-all duration-300 ease-premium ${
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <Moon
        className={`h-4 w-4 absolute transition-all duration-300 ease-premium ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </button>
  );
}
