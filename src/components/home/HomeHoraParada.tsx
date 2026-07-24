import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Faixa/CTA industrial (#16-G): depois da locação, o convite pro lead magnet
 * de custo de parada. Destino: /ferramentas/custo-de-parada (calculadora já
 * no ar). 1 foco laranja = o CTA.
 */
export function HomeHoraParada() {
  return (
    <section aria-label="Calcule o prejuízo da sua hora parada">
      <div className="container-msm py-12 md:py-16">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance max-w-2xl">
              Calcule o prejuízo da sua hora parada
            </h2>
            <Link href="/ferramentas/custo-de-parada" className="btn-primary group shrink-0">
              Calcular o custo da minha parada
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
