'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

/**
 * CTA de destaque no hero da página custo-de-parada (despacho): botão laranja
 * cheio (único laranja da hero navy), texto navy alto-contraste, generoso.
 * Rola suave até a calculadora (#calculadora — scroll-behavior smooth global).
 * Microinteração: hover scale+sombra + um pulse ÚNICO ao entrar na viewport
 * pra puxar o olho. reduced-motion respeitado (guard global zera a animação).
 */
export function CustoHeroCta() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.5 });

  return (
    <div ref={ref} className="pt-6">
      <Link
        href="#calculadora"
        className={`group inline-flex items-center gap-2.5 rounded-btn bg-gold px-7 py-4 font-sans text-lg font-semibold text-deep_navy shadow-premium-light transition-transform duration-200 ease-premium hover:scale-[1.03] hover:shadow-premium-dark motion-reduce:hover:scale-100 ${
          inView ? 'motion-safe:animate-cta-pulse' : ''
        }`}
      >
        Descobrir quanto estou perdendo
        <ArrowRight
          className="h-5 w-5 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </Link>
    </div>
  );
}
