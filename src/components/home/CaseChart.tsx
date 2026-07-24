'use client';

import { useInView } from '@/hooks/useInView';

/**
 * CaseChart — figura "antes/depois" do case Cinpal (92% de supressão de VTCD).
 * Painel navy fixo estilo instrumento de medição. Redesenho #16-C: fundo
 * antes×depois com tom (perigo/estável), onda intencional (sem serrilhado),
 * rótulos sem overlap, "−92% VTCD" número-herói, e ANIMAÇÃO ao entrar na
 * viewport (picos do antes pulsam; a linha do depois se desenha estável após
 * o divisor). prefers-reduced-motion respeitado (pulso via animate-led-pulse
 * com motion-reduce:animate-none; draw-path vira estado final).
 *
 * É uma REPRESENTAÇÃO ilustrativa do comportamento medido (rotulada como tal)
 * — sem eixo numérico fingindo precisão. Identidade nunca só por cor: rótulos
 * diretos "Antes/Depois".
 */

const W = 720;
const H = 300;
const PAD = { top: 48, right: 24, bottom: 44, left: 24 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const MID = 0.46; // posição x (fração) da instalação do Master Block
const BASE_Y = PAD.top + PLOT_H * 0.64; // linha de operação normal
const LIMIT_Y = PAD.top + PLOT_H * 0.28; // limite de segurança (tracejado)

// Curva determinística e INTENCIONAL: senos compostos (suave), sem ruído
// aleatório serrilhado. Picos de VTCD explícitos cruzam o limite no "antes".
function buildPaths() {
  const before: string[] = [];
  const after: string[] = [];
  const N = 320;
  // Frações ALINHADAS à grade de amostragem (k/N) → o ápice é amostrado
  // exato e cada pico tem 1 marcador, no topo.
  const SPIKE_AT = [0.05, 0.15, 0.25, 0.325, 0.4];
  const SPIKE_TOP = LIMIT_Y - 26;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = PAD.left + t * PLOT_W;
    const suave = Math.sin(t * 26) * 5 + Math.sin(t * 9) * 4;
    if (t <= MID) {
      let y = BASE_Y + suave;
      for (const s of SPIKE_AT) {
        const d = Math.abs(t - s);
        if (d < 0.016) {
          // pico estreito e intencional, acima do limite
          const altura = (1 - d / 0.016) * (BASE_Y - SPIKE_TOP);
          y = Math.min(y, BASE_Y - altura);
        }
      }
      before.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    if (t >= MID) {
      const y = BASE_Y + suave * 0.35;
      after.push(`${after.length === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
  }
  const spikes = SPIKE_AT.map((s) => ({ x: PAD.left + s * PLOT_W, y: SPIKE_TOP }));
  return { before: before.join(' '), after: after.join(' '), spikes };
}

const { before, after, spikes } = buildPaths();
const EVENT_X = PAD.left + MID * PLOT_W;
const FONT = "'Poppins', ui-sans-serif, system-ui, sans-serif";
const TXT = 'rgba(255,255,255,0.88)';
const MUTED = 'rgba(255,255,255,0.55)';

export function CaseChart() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.35 });

  return (
    <figure
      ref={ref}
      className="overflow-hidden rounded-card-lg border border-white/10 bg-deep_navy p-6 md:p-8"
    >
      {/* Cabeçalho do "instrumento" — −92% como número-herói ancorado */}
      <figcaption className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-white/55">
          Qualidade de energia · medição em campo — Cinpal (80 dias)
        </span>
        <span className="font-serif font-bold leading-none text-gold text-3xl md:text-4xl">
          −92% VTCD
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Gráfico ilustrativo: picos de tensão (VTCD) frequentes antes da instalação do Master Block e rede estável depois, com 92% de supressão medida"
        className="h-auto w-full"
      >
        {/* Fundo antes×depois — leve tom perigo/estável */}
        <rect x={PAD.left} y={PAD.top} width={EVENT_X - PAD.left} height={PLOT_H} fill="#EF4444" opacity={0.06} />
        <rect x={EVENT_X} y={PAD.top} width={W - PAD.right - EVENT_X} height={PLOT_H} fill="#22C55E" opacity={0.06} />

        {/* Grid recessivo */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + PLOT_H * f}
            y2={PAD.top + PLOT_H * f}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}

        {/* Limite de segurança — rótulo ACIMA da tracejada, à direita, com respiro */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={LIMIT_Y}
          y2={LIMIT_Y}
          stroke="rgba(255,255,255,0.32)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />
        <text
          x={W - PAD.right}
          y={LIMIT_Y - 12}
          textAnchor="end"
          fontFamily={FONT}
          fontSize={12}
          fill={MUTED}
        >
          Limite de segurança dos equipamentos
        </text>

        {/* Divisor limpo: instalação */}
        <line
          x1={EVENT_X}
          x2={EVENT_X}
          y1={PAD.top - 8}
          y2={PAD.top + PLOT_H}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1.5}
        />
        <text
          x={EVENT_X}
          y={PAD.top - 18}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={12.5}
          fontWeight={600}
          fill={TXT}
        >
          Instalação do Master Block
        </text>

        {/* Série: antes (picos cruzam o limite) */}
        <path
          d={before}
          fill="none"
          stroke="#D97706"
          strokeWidth={2.25}
          strokeLinejoin="round"
          className={`draw-path ${inView ? 'is-drawn' : ''}`}
          style={{ '--path-length': '1500px' } as React.CSSProperties}
        />
        {/* Halos nos picos — PULSAM quando a figura entra na viewport */}
        {spikes.map((s, i) => (
          <g key={i} opacity={inView ? 1 : 0} style={{ transition: `opacity 0.4s ease ${0.9 + i * 0.12}s` }}>
            <circle cx={s.x} cy={s.y} r={9} fill="#D97706" opacity={0.3} className="animate-led-pulse motion-reduce:animate-none" />
            <circle cx={s.x} cy={s.y} r={3.5} fill="#D97706" stroke="#002B47" strokeWidth={2} />
          </g>
        ))}

        {/* Série: depois — se DESENHA estável ao passar o divisor */}
        <path
          d={after}
          fill="none"
          stroke="#008CC8"
          strokeWidth={2.75}
          strokeLinejoin="round"
          className={`draw-path ${inView ? 'is-drawn' : ''}`}
          style={{ '--path-length': '400px', transitionDelay: '0.9s' } as React.CSSProperties}
        />

        {/* Rótulos diretos (identidade nunca só por cor) */}
        <g fontFamily={FONT} fontSize={13} fontWeight={600}>
          <circle cx={PAD.left + PLOT_W * 0.14} cy={H - 12} r={4} fill="#D97706" />
          <text x={PAD.left + PLOT_W * 0.14 + 10} y={H - 8} fill={TXT}>
            Antes: picos de VTCD queimam placas
          </text>
          <circle cx={PAD.left + PLOT_W * 0.62} cy={H - 12} r={4} fill="#008CC8" />
          <text x={PAD.left + PLOT_W * 0.62 + 10} y={H - 8} fill={TXT}>
            Depois: rede estável
          </text>
        </g>
      </svg>

      <p className="mt-4 text-[11px] leading-relaxed text-white/45">
        Representação ilustrativa do comportamento registrado por dois analisadores de energia
        (10/04–02/07/2024). Supressão de 92% dos VTCD comprovada tecnicamente; prejuízos de
        ~R$120 mil/mês com paradas cessaram após a instalação.
      </p>
    </figure>
  );
}
