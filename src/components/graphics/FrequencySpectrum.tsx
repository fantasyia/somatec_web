'use client';

import { useInView } from '@/hooks/useInView';

/**
 * Gráfico do argumento categoria-de-um: espectro de frequência onde a curva
 * do DPS comum morre em 10 kHz e a do Master Block segue até 100 kHz.
 * As curvas se desenham (stroke-dashoffset) quando a seção entra no viewport;
 * com prefers-reduced-motion o CSS mantém a transição, mas o estado final é
 * aplicado de imediato na prática (transition não é animação em loop).
 */
export function FrequencySpectrum({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox="0 0 760 380"
        role="img"
        aria-label="Gráfico: o DPS comum atua até 10 kHz; o Master Block segue atuando até 100 kHz"
        className="w-full"
      >
        {/* Grid técnico */}
        {[60, 130, 200, 270].map((y) => (
          <line key={y} x1={70} y1={y} x2={720} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
        ))}
        {[70, 232, 394, 556, 718].map((x, i) => (
          <g key={x}>
            <line x1={x} y1={40} x2={x} y2={310} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
            <text x={x} y={336} textAnchor="middle" fontSize={15} fill="currentColor" opacity={0.55} fontFamily="var(--font-inter)">
              {['0,1', '1', '10', '50', '100'][i]} kHz
            </text>
          </g>
        ))}
        <text x={70} y={368} fontSize={13} fill="currentColor" opacity={0.4} fontFamily="var(--font-inter)">
          Frequência do distúrbio →
        </text>

        {/* Faixa cega do DPS (10 kHz → 100 kHz) — sombreada âmbar + rótulo */}
        <rect x={394} y={40} width={324} height={270} fill="#F39200" opacity={inView ? 0.06 : 0} style={{ transition: 'opacity 1s ease 1.2s' }} />
        <text
          x={556}
          y={238}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill="#C77700"
          opacity={inView ? 0.9 : 0}
          style={{ transition: 'opacity 0.8s ease 1.5s' }}
          fontFamily="var(--font-inter)"
        >
          <tspan x={556} dy={0}>faixa cega do DPS —</tspan>
          <tspan x={556} dy={19}>onde só o Master Block age</tspan>
        </text>

        {/* Curva DPS comum — despenca num penhasco em 10 kHz */}
        <path
          d="M70,92 C170,93 280,97 348,108 C376,113 390,168 396,284"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="1 0"
          className={`draw-path ${inView ? 'is-drawn' : ''}`}
          style={{ '--path-length': '520px' } as React.CSSProperties}
        />
        <text x={180} y={72} fontSize={16} fontWeight={600} fill="currentColor" opacity={inView ? 0.55 : 0} style={{ transition: 'opacity 0.6s ease 0.9s' }} fontFamily="var(--font-inter)">
          DPS comum
        </text>
        {/* X onde o DPS para */}
        <g opacity={inView ? 1 : 0} style={{ transition: 'opacity 0.5s ease 1.4s' }}>
          <circle cx={396} cy={284} r={7} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={2.5} />
          <text x={388} y={306} fontSize={14} fontWeight={600} fill="currentColor" opacity={0.55} fontFamily="var(--font-inter)">
            para em 10 kHz
          </text>
        </g>

        {/* Curva Master Block — segue até 100 kHz */}
        <path
          d="M70,80 C200,78 340,80 460,86 C560,92 650,98 718,104"
          fill="none"
          stroke="#008CC8"
          strokeWidth={4.5}
          strokeLinecap="round"
          className={`draw-path ${inView ? 'is-drawn' : ''}`}
          style={{ '--path-length': '660px', transitionDelay: '0.5s' } as React.CSSProperties}
        />
        <g opacity={inView ? 1 : 0} style={{ transition: 'opacity 0.6s ease 1.8s' }}>
          <circle cx={718} cy={104} r={9} fill="#F39200" />
          <circle cx={718} cy={104} r={16} fill="#F39200" opacity={0.25} className="animate-led-pulse motion-reduce:animate-none" />
          <text x={712} y={76} textAnchor="end" fontSize={17} fontWeight={700} fill="#008CC8" fontFamily="var(--font-inter)">
            Master Block · atua em 100 kHz
          </text>
        </g>
      </svg>
    </div>
  );
}
