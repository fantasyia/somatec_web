/**
 * CaseChart — figura "antes/depois" do case Cinpal (92% de supressão de VTCD).
 * Painel navy fixo (mesmo nos 2 temas) estilo instrumento de medição.
 *
 * É uma REPRESENTAÇÃO ilustrativa do comportamento medido (rotulada como tal)
 * — por isso não há tooltip/eixo numérico fingindo precisão. Paleta validada
 * (dataviz): antes #D97706 · depois #008CC8 sobre #002B47 (todos os checks PASS,
 * ΔE CVD 95.6). Identidade nunca só por cor: rótulos diretos "Antes/Depois".
 */

const W = 720;
const H = 300;
const PAD = { top: 44, right: 20, bottom: 40, left: 20 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const MID = 0.46; // posição x (fração) da instalação do Master Block
const BASE_Y = PAD.top + PLOT_H * 0.62; // linha de operação normal
const LIMIT_Y = PAD.top + PLOT_H * 0.3; // limite de segurança (tracejado)

// LCG determinístico — mesma curva em todo render (RSC, sem hidratação).
function lcg(seed: number) {
  let s = seed;
  return () => ((s = (s * 48271) % 2147483647) / 2147483647);
}

function buildPaths() {
  const rnd = lcg(20260707);
  const before: string[] = [];
  const after: string[] = [];
  const spikes: { x: number; y: number }[] = [];
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = PAD.left + t * PLOT_W;
    const wave = Math.sin(t * 42) * 7;
    if (t <= MID) {
      // Antes: ruidoso, com picos (VTCD) estourando o limite de segurança.
      let y = BASE_Y + wave + (rnd() - 0.5) * 16;
      if (i % 14 === 6) {
        y = LIMIT_Y - 14 - rnd() * 26; // pico acima do limite
        spikes.push({ x, y });
      }
      before.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    if (t >= MID) {
      // Depois: estável, sempre abaixo do limite.
      const y = BASE_Y + wave * 0.5 + (rnd() - 0.5) * 4;
      after.push(`${after.length === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
  }
  return { before: before.join(' '), after: after.join(' '), spikes };
}

const { before, after, spikes } = buildPaths();
const EVENT_X = PAD.left + MID * PLOT_W;
const FONT = "'Poppins', ui-sans-serif, system-ui, sans-serif";
const TXT = 'rgba(255,255,255,0.88)';
const MUTED = 'rgba(255,255,255,0.55)';

export function CaseChart() {
  return (
    <figure className="rounded-card-lg border border-white/10 bg-deep_navy texture-diagonal p-5 md:p-7 overflow-hidden">
      {/* Cabeçalho do "instrumento" */}
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-white/55">
          Qualidade de energia · medição em campo — Cinpal (80 dias)
        </span>
        <span className="font-serif font-bold text-gold text-lg md:text-xl">−92% VTCD</span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Gráfico ilustrativo: picos de tensão (VTCD) frequentes antes da instalação do Master Block e rede estável depois, com 92% de supressão medida"
        className="w-full h-auto"
      >
        {/* Grid recessivo */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + PLOT_H * f}
            y2={PAD.top + PLOT_H * f}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        ))}

        {/* Limite de segurança */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={LIMIT_Y}
          y2={LIMIT_Y}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />
        <text x={PAD.left} y={LIMIT_Y - 8} fontFamily={FONT} fontSize={12} fill={MUTED}>
          Limite de segurança dos equipamentos
        </text>

        {/* Evento: instalação */}
        <line
          x1={EVENT_X}
          x2={EVENT_X}
          y1={PAD.top - 6}
          y2={PAD.top + PLOT_H}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.5}
        />
        <text
          x={EVENT_X}
          y={PAD.top - 16}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={12.5}
          fontWeight={600}
          fill={TXT}
        >
          Instalação do Master Block
        </text>

        {/* Série: antes (ruidosa) */}
        <path d={before} fill="none" stroke="#D97706" strokeWidth={2} strokeLinejoin="round" />
        {/* Halos nos picos que estouram o limite */}
        {spikes.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={3.5} fill="#D97706" stroke="#002B47" strokeWidth={2} />
        ))}

        {/* Série: depois (estável) */}
        <path d={after} fill="none" stroke="#008CC8" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Rótulos diretos (identidade nunca só por cor) */}
        <g fontFamily={FONT} fontSize={13} fontWeight={600}>
          <circle cx={PAD.left + PLOT_W * 0.16} cy={H - 14} r={4} fill="#D97706" />
          <text x={PAD.left + PLOT_W * 0.16 + 10} y={H - 10} fill={TXT}>
            Antes: picos de VTCD queimam placas
          </text>
          <circle cx={PAD.left + PLOT_W * 0.62} cy={H - 14} r={4} fill="#008CC8" />
          <text x={PAD.left + PLOT_W * 0.62 + 10} y={H - 10} fill={TXT}>
            Depois: rede estável
          </text>
        </g>
      </svg>

      <p className="mt-3 text-[11px] leading-relaxed text-white/45">
        Representação ilustrativa do comportamento registrado por dois analisadores de energia
        (10/04–02/07/2024). Supressão de 92% dos VTCD comprovada tecnicamente; prejuízos de
        ~R$120 mil/mês com paradas cessaram após a instalação.
      </p>
    </figure>
  );
}
