'use client';

import { PlugZap, Waves, Wind, Cpu, Snowflake, Monitor, type LucideIcon } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

// =============================================================================
// Diagrama de cascata (LPs NI) — a entrada + os quadros secundários acendem em
// LARANJA um a um, contando a história sozinho: proteger só a entrada é trancar
// a porta e deixar a janela aberta. Laranja SÓ nos pontos de proteção.
// prefers-reduced-motion: tudo já aceso, sem sequência (guard global de 0.01ms
// zera a transição, então caímos direto no estado final).
//
// Os ícones vivem AQUI (client): passar componente lucide via prop cruzaria a
// fronteira Server→Client (React barra objetos com métodos). A página só passa
// o `setor`.
// =============================================================================

type Ponto = { Icon: LucideIcon; label: string };

const PONTOS: Record<'residencial' | 'comercial', Ponto[]> = {
  residencial: [
    { Icon: Waves, label: 'Piscina' },
    { Icon: Wind, label: 'Ar-condicionado' },
    { Icon: Cpu, label: 'Automação' },
  ],
  comercial: [
    { Icon: Snowflake, label: 'Câmara fria' },
    { Icon: Monitor, label: 'PDV / servidores' },
    { Icon: Wind, label: 'Ar-condicionado' },
  ],
};

type Props = {
  setor: 'residencial' | 'comercial';
  entradaLabel: string;
  /** aria-label do grupo pra leitor de tela. */
  titulo: string;
};

export function CascataDiagram({ setor, entradaLabel, titulo }: Props) {
  const pontos = PONTOS[setor];
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  const nodeBase =
    'relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-500 ease-premium';

  return (
    <div ref={ref} role="img" aria-label={titulo}>
      {/* ── Desktop: entrada à esquerda, ramo pros secundários ─────── */}
      <div className="hidden md:flex md:items-center md:gap-8">
        {/* Entrada (acende primeiro) */}
        <div className="flex shrink-0 flex-col items-center text-center">
          <span
            className={`${nodeBase} ${
              inView ? 'border-gold bg-gold/10 text-gold' : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
            }`}
            style={{ transitionDelay: '0.1s' }}
          >
            <PlugZap className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="mt-2 max-w-[120px] font-sans text-sm font-semibold text-[rgb(var(--text))]">
            {entradaLabel}
          </span>
        </div>

        {/* Trunk que preenche em direção aos secundários */}
        <div className="relative h-0.5 w-12 shrink-0 bg-[rgb(var(--border))]" aria-hidden="true">
          <div
            className="absolute inset-y-0 left-0 origin-left bg-gold transition-transform duration-700 ease-premium"
            style={{ width: '100%', transform: inView ? 'scaleX(1)' : 'scaleX(0)', transitionDelay: '0.35s' }}
          />
        </div>

        {/* Secundários */}
        <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
          {pontos.map(({ Icon, label }, i) => (
            <div key={label} className="flex flex-col items-center text-center">
              <span
                className={`${nodeBase} ${
                  inView ? 'border-gold bg-gold/10 text-gold' : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
                }`}
                style={{ transitionDelay: `${0.6 + i * 0.3}s` }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="mt-2 max-w-[120px] font-sans text-xs font-medium text-[rgb(var(--text-muted))]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: lista vertical, acende de cima pra baixo ───────── */}
      <div className="space-y-4 md:hidden">
        <div className="flex items-center gap-3">
          <span
            className={`${nodeBase} h-11 w-11 ${
              inView ? 'border-gold bg-gold/10 text-gold' : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
            }`}
            style={{ transitionDelay: '0.1s' }}
          >
            <PlugZap className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="font-sans text-sm font-semibold text-[rgb(var(--text))]">{entradaLabel}</span>
        </div>
        <div className="ml-5 space-y-4 border-l-2 border-[rgb(var(--border))] pl-6">
          {pontos.map(({ Icon, label }, i) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className={`${nodeBase} h-10 w-10 ${
                  inView ? 'border-gold bg-gold/10 text-gold' : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
                }`}
                style={{ transitionDelay: `${0.4 + i * 0.25}s` }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="font-sans text-sm font-medium text-[rgb(var(--text))]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
