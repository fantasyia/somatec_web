'use client';

import { useEffect, useRef, useState } from 'react';

type Options = {
  /** Fração do elemento visível p/ disparar. Default 0 (qualquer parte). */
  threshold?: number;
  /** Anima só uma vez (não re-dispara ao sair/entrar). Default true. */
  triggerOnce?: boolean;
  /** Margem do root. Default antecipa 96px abaixo da viewport p/ o fade
   *  começar antes do elemento dominar a tela — evita "flash" em scroll rápido. */
  rootMargin?: string;
};

/**
 * Observa quando um elemento entra no viewport via IntersectionObserver.
 * Retorna { ref, inView }. SSR-safe (inView começa false; só muda no client).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(options: Options = {}) {
  const { threshold = 0, triggerOnce = true, rootMargin = '0px 0px 96px 0px' } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Sem IntersectionObserver (ambiente antigo) → mostra direto.
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fallback de ambiente sem IO; conteúdo precisa aparecer
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, triggerOnce, rootMargin]);

  return { ref, inView };
}
