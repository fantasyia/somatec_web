'use client';

import { useInView } from '@/hooks/useInView';

/**
 * Gráfico do argumento categoria-de-um: espectro de frequência onde a curva
 * do DPS comum morre em 10 kHz e a do Master Block segue até 100 kHz.
 *
 * ⚠️ Eixo X é LOGARÍTMICO de verdade (correção 2026-07-29): antes as marcas
 * ficavam igualmente espaçadas, então "10 → 50 kHz" ocupava a mesma largura de
 * "0,1 → 1 kHz" (uma década inteira) e o 50 kHz caía no lugar errado. Agora a
 * posição sai de posX(), com as décadas do mesmo tamanho e as marcas menores
 * (2·3·5 de cada década) no lugar certo — como num gráfico técnico real.
 *
 * As curvas se desenham (stroke-dashoffset) quando a seção entra no viewport;
 * com prefers-reduced-motion o estado final é aplicado de imediato na prática.
 */

// Área de plotagem
const X0 = 70;
const X1 = 718;
const Y_TOP = 40;
const Y_BASE = 310;

// Domínio: 0,1 kHz → 100 kHz = 3 décadas
const DECADAS = 3;
const PX_DECADA = (X1 - X0) / DECADAS; // 216 px por década

/** Posição no eixo log. f em kHz. */
const posX = (f: number) => X0 + PX_DECADA * (Math.log10(f) + 1);

const MAIORES: { f: number; label: string }[] = [
  { f: 0.1, label: '0,1 kHz' },
  { f: 1, label: '1 kHz' },
  { f: 10, label: '10 kHz' },
  { f: 100, label: '100 kHz' },
];

/** Marcas menores de cada década (2, 3, 5) — dão a “cara” de escala log. */
const MENORES = [0.2, 0.3, 0.5, 2, 3, 5, 20, 30, 50];

const X_10K = posX(10); // 502 — onde o DPS morre e começa a faixa cega

export function FrequencySpectrum({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox="0 0 760 380"
        role="img"
        aria-label="Gráfico em escala logarítmica de frequência: o DPS comum protege até 10 kHz e despenca; o Master Block segue atuando por toda a década seguinte, até 100 kHz"
        className="w-full"
      >
        {/* Grid horizontal */}
        {[60, 130, 200, 270].map((y) => (
          <line key={y} x1={X0} y1={y} x2={X1} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
        ))}

        {/* Marcas menores (sem rótulo) */}
        {MENORES.map((f) => (
          <line
            key={f}
            x1={posX(f)}
            y1={Y_TOP}
            x2={posX(f)}
            y2={Y_BASE}
            stroke="currentColor"
            strokeOpacity={0.04}
            strokeWidth={1}
          />
        ))}

        {/* Décadas + rótulos */}
        {MAIORES.map(({ f, label }) => (
          <g key={f}>
            <line x1={posX(f)} y1={Y_TOP} x2={posX(f)} y2={Y_BASE} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
            <text
              x={posX(f)}
              y={336}
              textAnchor="middle"
              fontSize={15}
              fill="currentColor"
              opacity={0.55}
              fontFamily="var(--font-inter)"
            >
              {label}
            </text>
          </g>
        ))}

        <text x={X0} y={368} fontSize={13} fill="currentColor" opacity={0.4} fontFamily="var(--font-inter)">
          Frequência do distúrbio →
        </text>
        {/* Eixo Y: o que a altura significa */}
        <text
          x={-175}
          y={22}
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize={13}
          fill="currentColor"
          opacity={0.4}
          fontFamily="var(--font-inter)"
        >
          Proteção efetiva →
        </text>

        {/* Faixa cega do DPS: a década inteira de 10 kHz a 100 kHz */}
        <rect
          x={X_10K}
          y={Y_TOP}
          width={X1 - X_10K}
          height={Y_BASE - Y_TOP}
          fill="#F39200"
          opacity={inView ? 0.06 : 0}
          style={{ transition: 'opacity 1s ease 1.2s' }}
        />
        <text
          x={(X_10K + X1) / 2}
          y={238}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill="#C77700"
          opacity={inView ? 0.9 : 0}
          style={{ transition: 'opacity 0.8s ease 1.5s' }}
          fontFamily="var(--font-inter)"
        >
          <tspan x={(X_10K + X1) / 2} dy={0}>faixa cega do DPS —</tspan>
          <tspan x={(X_10K + X1) / 2} dy={19}>onde só o Master Block age</tspan>
        </text>

        {/* Curva DPS comum — segura até ~5 kHz e despenca no penhasco de 10 kHz */}
        <path
          d={`M${X0},92 C200,93 400,97 455,108 C484,114 ${X_10K - 6},170 ${X_10K},284`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeWidth={3.5}
          strokeLinecap="round"
          className={`draw-path ${inView ? 'is-drawn' : ''}`}
          style={{ '--path-length': '560px' } as React.CSSProperties}
        />
        <text x={190} y={72} fontSize={16} fontWeight={600} fill="currentColor" opacity={inView ? 0.55 : 0} style={{ transition: 'opacity 0.6s ease 0.9s' }} fontFamily="var(--font-inter)">
          DPS comum
        </text>

        {/* Marca de onde o DPS para */}
        <g opacity={inView ? 1 : 0} style={{ transition: 'opacity 0.5s ease 1.4s' }}>
          <circle cx={X_10K} cy={284} r={7} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={2.5} />
          <text x={X_10K - 12} y={306} textAnchor="end" fontSize={14} fontWeight={600} fill="currentColor" opacity={0.55} fontFamily="var(--font-inter)">
            para em 10 kHz
          </text>
        </g>

        {/* Curva Master Block — atravessa a faixa cega inteira */}
        <path
          d={`M${X0},80 C220,78 380,84 ${X_10K},90 C580,95 660,100 ${X1},104`}
          fill="none"
          stroke="#008CC8"
          strokeWidth={4.5}
          strokeLinecap="round"
          className={`draw-path ${inView ? 'is-drawn' : ''}`}
          style={{ '--path-length': '660px', transitionDelay: '0.5s' } as React.CSSProperties}
        />
        <g opacity={inView ? 1 : 0} style={{ transition: 'opacity 0.6s ease 1.8s' }}>
          <circle cx={X1} cy={104} r={9} fill="#F39200" />
          <circle cx={X1} cy={104} r={16} fill="#F39200" opacity={0.25} className="animate-led-pulse motion-reduce:animate-none" />
          <text x={X1 - 6} y={76} textAnchor="end" fontSize={17} fontWeight={700} fill="#008CC8" fontFamily="var(--font-inter)">
            Master Block · atua em 100 kHz
          </text>
        </g>
      </svg>
    </div>
  );
}
