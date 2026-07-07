'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Anima um número de 0 até o valor quando entra na viewport (uma vez).
 * Recebe o texto completo ("92%", "100 kHz", "26 anos") e anima só a parte
 * numérica, preservando o sufixo. Sem parte numérica → renderiza como veio.
 * Respeita prefers-reduced-motion (mostra o valor final direto).
 */
export function CountUp({ value, durationMs = 1400 }: { value: string; durationMs?: number }) {
  const match = /^(\d+)(.*)$/.exec(value.trim());
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';

  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number | null>(target !== null ? 0 : null);

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // Reduced motion: mostra o valor final direto, sem animar.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setDisplay(target);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          setDisplay(Math.round(eased * target));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  if (target === null) return <>{value}</>;

  return (
    // Cópia invisível do valor final reserva a largura — o texto centralizado
    // não "anda" enquanto o número sobe.
    <span ref={ref} className="relative inline-block tabular-nums">
      <span aria-hidden="true" className="invisible">
        {target}
        {suffix}
      </span>
      <span className="absolute inset-0">
        {display}
        {suffix}
      </span>
    </span>
  );
}
