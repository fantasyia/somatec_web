/**
 * CascadeDiagram — a proteção em cascata em uma figura: o surto entra grande
 * na instalação e é atenuado em cada estágio de Master Block até chegar
 * inofensivo ao equipamento sensível. SVG vetorial, tema-safe (painel navy).
 * Animação: pulso sutil no surto de entrada (globals.css zera com
 * prefers-reduced-motion).
 */

const FONT = "'Poppins', ui-sans-serif, system-ui, sans-serif";
const TXT = 'rgba(255,255,255,0.9)';
const MUTED = 'rgba(255,255,255,0.55)';
const ORANGE = '#F7941D';
const CYAN = '#33A6D6';

function Bolt({ x, y, scale, className }: { x: number; y: number; scale: number; className?: string }) {
  // Raio (surto) — âncora no centro; escala indica a energia restante.
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} className={className}>
      <path
        d="M6,-26 L-8,4 L0,4 L-4,26 L12,-6 L3,-6 Z"
        fill={ORANGE}
        stroke="#002B47"
        strokeWidth={1.5}
      />
    </g>
  );
}

function MbBlock({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-34} y={-26} width={68} height={52} rx={10} fill="#F7941D" opacity={0.14} />
      <rect x={-34} y={-26} width={68} height={52} rx={10} fill="none" stroke={ORANGE} strokeWidth={2} />
      <text x={0} y={5} textAnchor="middle" fontFamily={FONT} fontSize={17} fontWeight={800} fill={TXT}>
        MB
      </text>
      <text x={0} y={48} textAnchor="middle" fontFamily={FONT} fontSize={12} fontWeight={600} fill={TXT}>
        {label}
      </text>
    </g>
  );
}

export function CascadeDiagram() {
  const W = 680;
  const H = 240;
  const wireY = 96;
  return (
    <figure className="rounded-card-lg border border-white/10 bg-white/[0.03] p-4 md:p-6">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Diagrama da proteção em cascata: o surto entra forte pela rede, é atenuado no Master Block da entrada, depois no do quadro de distribuição e chega inofensivo ao equipamento protegido"
        className="w-full h-auto"
      >
        {/* Fio condutor */}
        <line x1={16} x2={W - 16} y1={wireY} y2={wireY} stroke="rgba(255,255,255,0.25)" strokeWidth={2.5} />

        {/* Rede (origem) */}
        <text x={22} y={wireY - 52} fontFamily={FONT} fontSize={12} fontWeight={600} fill={MUTED}>
          Rede elétrica
        </text>

        {/* Surto entrando — grande, pulsando */}
        <Bolt x={64} y={wireY - 34} scale={1.5} className="animate-pulse" />

        {/* Estágio 1 */}
        <MbBlock x={190} y={wireY} label="Entrada da instalação" />
        {/* Surto atenuado */}
        <Bolt x={300} y={wireY - 26} scale={0.95} />

        {/* Estágio 2 */}
        <MbBlock x={400} y={wireY} label="Quadro de distribuição" />
        {/* Surto residual */}
        <Bolt x={492} y={wireY - 20} scale={0.5} />

        {/* Equipamento protegido */}
        <g transform={`translate(${W - 90},${wireY})`}>
          <rect x={-36} y={-30} width={72} height={60} rx={10} fill={CYAN} opacity={0.12} />
          <rect x={-36} y={-30} width={72} height={60} rx={10} fill="none" stroke={CYAN} strokeWidth={2} />
          {/* CLP: linhas de "display" */}
          <line x1={-22} x2={10} y1={-12} y2={-12} stroke={CYAN} strokeWidth={3} strokeLinecap="round" />
          <line x1={-22} x2={22} y1={0} y2={0} stroke={CYAN} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
          {/* check de protegido */}
          <path d="M6,10 L13,17 L26,2" fill="none" stroke={CYAN} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontSize={12} fontWeight={600} fill={TXT}>
            Equipamento protegido
          </text>
        </g>

        {/* Legenda de atenuação */}
        <g fontFamily={FONT} fontSize={12.5} fontWeight={600}>
          <text x={64} y={wireY - 74} textAnchor="middle" fill={TXT}>Surto</text>
          <text x={300} y={wireY - 62} textAnchor="middle" fill={MUTED}>atenuado</text>
          <text x={492} y={wireY - 48} textAnchor="middle" fill={MUTED}>residual</text>
        </g>

        {/* Seta do fluxo */}
        <g stroke="rgba(255,255,255,0.4)" strokeWidth={2} fill="none" strokeLinecap="round">
          <path d={`M${W / 2 - 30},${H - 26} H${W / 2 + 22}`} />
          <path d={`M${W / 2 + 14},${H - 32} L${W / 2 + 24},${H - 26} L${W / 2 + 14},${H - 20}`} />
        </g>
        <text x={W / 2 - 40} y={H - 21} textAnchor="end" fontFamily={FONT} fontSize={11.5} fill={MUTED}>
          o surto perde força em cada estágio
        </text>
      </svg>
    </figure>
  );
}
