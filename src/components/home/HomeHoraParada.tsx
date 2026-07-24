import Link from 'next/link';
import { ChevronRight, PackageX, Trash2, Clock, Wrench, Cpu } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import type { LucideIcon } from 'lucide-react';

/**
 * Módulo "hora parada" (#16 + adendo): unifica o lead magnet industrial com o
 * argumento do saving que antes era legenda da locação — o argumento subiu de
 * nível e virou este módulo. 5 chips concretizam os componentes do custo.
 * CTA → /ferramentas/custo-de-parada (calculadora no ar). 1 laranja = o CTA.
 */

const COMPONENTES_DO_CUSTO: { Icon: LucideIcon; label: string }[] = [
  { Icon: PackageX, label: 'produção perdida' },
  { Icon: Trash2, label: 'refugo' },
  { Icon: Clock, label: 'hora extra' },
  { Icon: Wrench, label: 'manutenção' },
  { Icon: Cpu, label: 'equipamento queimado' },
];

export function HomeHoraParada() {
  return (
    <section aria-label="Uma hora parada por mês já paga a conta">
      <div className="container-msm section-y">
        <Reveal className="max-w-3xl space-y-4">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Uma hora parada por mês já paga a conta.
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Produção que não saiu, refugo, hora extra, manutenção e equipamento
            queimado entram na conta — e em boa parte das fábricas uma única
            hora de linha parada por mês já supera o valor da mensalidade. Veja
            quanto é na sua.
          </p>
        </Reveal>

        {/* Componentes do custo — chips concretos */}
        <Reveal delay={80} className="mt-6 flex flex-wrap gap-2.5">
          {COMPONENTES_DO_CUSTO.map(({ Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-1.5 font-sans text-[13px] font-semibold text-[rgb(var(--text))]"
            >
              <Icon className="h-4 w-4 text-cyan" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </span>
          ))}
        </Reveal>

        <Reveal delay={140} className="mt-8">
          <Link href="/ferramentas/custo-de-parada" className="btn-primary group inline-flex">
            Calcular o prejuízo da minha parada
            <ChevronRight
              className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
