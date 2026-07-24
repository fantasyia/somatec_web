'use client';

import { useInView } from '@/hooks/useInView';

/**
 * Gráfico ilustrativo "a conta que soma" (despacho hora-parada): barra
 * EMPILHADA com os 5 custos subindo e CRUZANDO a linha tracejada "valor da
 * mensalidade" — a pilha ultrapassa claramente a linha (o título em imagem:
 * 1h parada > mensalidade). LARANJA só na parte ACIMA da linha. Os rótulos
 * dos segmentos substituem os chips (some a redundância chip+texto).
 * Anima ao rolar: empilha de baixo pra cima (scaleY, stagger); com
 * prefers-reduced-motion o guard global zera as transições (estado final).
 * REPRESENTAÇÃO ILUSTRATIVA — proporções não são medição real.
 */

const W = 640;
const H = 400;
const PAD = { top: 36, bottom: 46 };
const PLOT_H = H - PAD.top - PAD.bottom;
const BAR_X = 150;
const BAR_W = 170;
const UNIDADES = 100; // escala vertical

// De baixo pra cima. A linha da mensalidade cai EXATAMENTE no topo dos 3
// primeiros (56) — manutenção e equipamento queimado ficam ACIMA → laranja.
const SEGMENTOS = [
  { label: 'produção perdida', h: 30, cor: '#00416E' },
  { label: 'refugo', h: 12, cor: '#008CC8' },
  { label: 'hora extra', h: 14, cor: '#33A6D6' },
  { label: 'manutenção', h: 16, cor: '#F7B155' },
  { label: 'equipamento queimado', h: 20, cor: '#F39200' },
] as const;

const LINHA_UNIDADES = 56; // valor da mensalidade
const unit = PLOT_H / UNIDADES;
const yFromTop = (unidadesAcumuladas: number) => PAD.top + PLOT_H - unidadesAcumuladas * unit;
const LINHA_Y = yFromTop(LINHA_UNIDADES);

const FONT = 'var(--font-inter)';

// Pré-computado em módulo (dados estáticos) — nada muta durante o render.
const RECTS = (() => {
  let acumulado = 0;
  return SEGMENTOS.map((s, i) => {
    const y = yFromTop(acumulado + s.h);
    const alt = s.h * unit;
    const meioY = y + alt / 2;
    acumulado += s.h;
    return { ...s, y, alt, meioY, i };
  });
})();

export function HoraParadaChart() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });

  return (
    <div ref={ref}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Gráfico ilustrativo: os cinco custos de uma parada somados ultrapassam o valor da mensalidade"
        className="h-auto w-full"
      >
        {/* Barra empilhada — cada custo sobe de baixo pra cima */}
        {RECTS.map(({ label, cor, y, alt, meioY, i }) => (
          <g key={label}>
            <rect
              x={BAR_X}
              y={y}
              width={BAR_W}
              height={alt}
              fill={cor}
              rx={3}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'bottom',
                transform: inView ? 'scaleY(1)' : 'scaleY(0)',
                transition: `transform 0.55s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.18}s`,
              }}
            />
            {/* Rótulo do segmento (substitui os chips) */}
            <g
              opacity={inView ? 1 : 0}
              style={{ transition: `opacity 0.4s ease ${0.35 + i * 0.18}s` }}
            >
              <line
                x1={BAR_X + BAR_W}
                x2={BAR_X + BAR_W + 18}
                y1={meioY}
                y2={meioY}
                stroke="currentColor"
                strokeOpacity={0.35}
                strokeWidth={1}
              />
              <text
                x={BAR_X + BAR_W + 24}
                y={meioY + 4}
                fontFamily={FONT}
                fontSize={14}
                fontWeight={600}
                fill="currentColor"
                fillOpacity={0.8}
              >
                {label}
              </text>
            </g>
          </g>
        ))}

        {/* Linha tracejada: valor da mensalidade */}
        <g opacity={inView ? 1 : 0} style={{ transition: 'opacity 0.5s ease 0.1s' }}>
          <line
            x1={60}
            x2={W - 24}
            y1={LINHA_Y}
            y2={LINHA_Y}
            stroke="currentColor"
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeDasharray="7 6"
          />
          <text
            x={60}
            y={LINHA_Y - 10}
            fontFamily={FONT}
            fontSize={13.5}
            fontWeight={600}
            fill="currentColor"
            fillOpacity={0.7}
          >
            valor da mensalidade
          </text>
        </g>

        {/* Chave do excedente: "já paga a conta" (laranja, acima da linha) */}
        <g
          opacity={inView ? 1 : 0}
          style={{ transition: 'opacity 0.5s ease 1.25s' }}
          fontFamily={FONT}
        >
          <line
            x1={BAR_X - 26}
            x2={BAR_X - 26}
            y1={yFromTop(UNIDADES - 8)}
            y2={LINHA_Y}
            stroke="#F39200"
            strokeWidth={2}
          />
          <line x1={BAR_X - 26} x2={BAR_X - 16} y1={yFromTop(UNIDADES - 8)} y2={yFromTop(UNIDADES - 8)} stroke="#F39200" strokeWidth={2} />
          <line x1={BAR_X - 26} x2={BAR_X - 16} y1={LINHA_Y} y2={LINHA_Y} stroke="#F39200" strokeWidth={2} />
          <text
            x={BAR_X - 38}
            y={(yFromTop(UNIDADES - 8) + LINHA_Y) / 2}
            fontSize={14}
            fontWeight={700}
            fill="#F39200"
            textAnchor="end"
          >
            <tspan x={BAR_X - 38} dy={-4}>já paga</tspan>
            <tspan x={BAR_X - 38} dy={18}>a conta</tspan>
          </text>
        </g>
      </svg>
    </div>
  );
}
