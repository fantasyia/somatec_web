'use client';

import { Search, PencilRuler, FileText, Wrench, GaugeCircle } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import type { LucideIcon } from 'lucide-react';

/**
 * Timeline da LOCAÇÃO (#16-D): 5 nós conectados por uma linha que PREENCHE
 * ao entrar na viewport; cada nó acende em sequência. "sem custo" corre pelos
 * 5 passos; o marcador final diz onde o pagamento começa (só se aprovar).
 * Desktop horizontal · mobile empilha vertical. reduced-motion: transições
 * viram estado final (guard global de 0.01ms).
 */

const STEPS: { Icon: LucideIcon; label: string }[] = [
  { Icon: Search, label: 'Estudo da rede' },
  { Icon: PencilRuler, label: 'Projeto do sistema' },
  { Icon: FileText, label: 'Proposta técnica' },
  { Icon: Wrench, label: 'Instalação' },
  { Icon: GaugeCircle, label: 'Período de avaliação' },
];

export function LocacaoTimeline() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  // Nota da jornada (desktop + mobile): amarra os 5 passos ao prazo total e
  // deixa explícito que o pagamento só começa DEPOIS de tudo — e só se aprovar.
  const nota = (
    <div className="flex items-start gap-3 rounded-card border border-gold/30 bg-gold/[0.06] p-4 md:items-center md:justify-center md:p-5 md:text-center">
      <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-gold md:mt-0" aria-hidden="true" />
      <p className="font-sans text-sm leading-relaxed text-[rgb(var(--text))] md:text-[15px]">
        Estudo da rede, projeto, proposta, instalação e período de avaliação levam de{' '}
        <span className="font-semibold text-gold">60 a 90 dias — tudo sem custo</span>. Você só
        começa a pagar <span className="font-semibold">depois de toda essa jornada</span>, e só se
        aprovar o resultado.
      </p>
    </div>
  );

  return (
    <div ref={ref}>
      {/* ── Desktop: horizontal conectado ─────────────────────────── */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Trilho + preenchimento progressivo — vai até a bolinha laranja
              (o ponto onde o pagamento começa), logo após o 5º nó. */}
          <div className="absolute left-[10%] right-[4%] top-6 h-0.5 bg-[rgb(var(--border))]" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="absolute left-[10%] top-6 h-0.5 origin-left bg-cyan transition-transform duration-[1600ms] ease-premium"
            style={{ width: '86%', transform: inView ? 'scaleX(1)' : 'scaleX(0)' }}
          />
          {/* Bolinha laranja ANCORADA no trilho — marca onde o pagamento começa */}
          <span
            aria-hidden="true"
            className="absolute right-[4%] top-6 z-10 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-gold shadow-[0_0_0_5px_rgba(243,146,0,0.18)] transition-all duration-700 ease-premium"
            style={{ opacity: inView ? 1 : 0, transform: `translate(50%,-50%) scale(${inView ? 1 : 0.4})`, transitionDelay: '1.9s' }}
          />
          <ol className="relative grid grid-cols-5">
            {STEPS.map(({ Icon, label }, i) => (
              <li
                key={label}
                className="flex flex-col items-center text-center transition-all duration-500 ease-premium"
                style={{
                  opacity: inView ? 1 : 0.25,
                  transform: inView ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: `${0.25 + i * 0.28}s`,
                }}
              >
                <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-cyan bg-[rgb(var(--bg))] text-cyan">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="mt-3 font-sans text-[13px] font-bold text-cyan">
                  sem custo
                </span>
                <span className="mt-1 max-w-[150px] font-sans text-base font-semibold leading-snug text-[rgb(var(--text))]">
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>
        {/* Nota da jornada — amarra o prazo total e o momento do pagamento */}
        <div
          className="mt-9 transition-opacity duration-700 ease-premium"
          style={{ opacity: inView ? 1 : 0, transitionDelay: '2.05s' }}
        >
          {nota}
        </div>
      </div>

      {/* ── Mobile: empilha vertical ──────────────────────────────── */}
      <div className="md:hidden">
        <ol className="relative ml-6 border-l-2 border-[rgb(var(--border))] pl-6">
          {STEPS.map(({ Icon, label }, i) => (
            <li
              key={label}
              className="relative pb-7 transition-all duration-500 ease-premium"
              style={{
                opacity: inView ? 1 : 0.25,
                transitionDelay: `${0.15 + i * 0.2}s`,
              }}
            >
              <span className="absolute -left-[37px] inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-cyan bg-[rgb(var(--bg))] text-cyan">
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="font-sans text-xs font-bold text-cyan">sem custo</div>
              <div className="font-sans text-base font-semibold text-[rgb(var(--text))]">{label}</div>
            </li>
          ))}
        </ol>
        <div
          className="mt-6 transition-opacity duration-700 ease-premium"
          style={{ opacity: inView ? 1 : 0, transitionDelay: '1.4s' }}
        >
          {nota}
        </div>
      </div>
    </div>
  );
}
