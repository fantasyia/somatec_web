'use client';

import { useInView } from '@/hooks/useInView';

// =============================================================================
// Diagrama unifilar de EXEMPLO (trilha industrial) — desenho PRÓPRIO da Somatec.
//
// Por que redesenhado e não a imagem do projeto de um cliente: o documento
// original é de uma planta real. Aqui a estrutura didática é a mesma (entrada →
// subestação → subestações internas → painéis de baixa → galpões), mas o layout
// é outro (o setor administrativo desceu pro rodapé), a identidade é a da marca
// e — o que o documento original não tem — os PONTOS DE PROTEÇÃO em cascata
// aparecem em laranja, acendendo em sequência. Sem nome de cliente, de
// concessionária ou de unidade.
//
// prefers-reduced-motion: o guard global zera as transições → estado final direto.
// =============================================================================

type Ramo = {
  se: string;
  trafo: string;
  galpao: string;
  detalhe: string[];
};

const RAMOS: readonly Ramo[] = [
  { se: 'Subestação 1', trafo: '1× 1000 kVA', galpao: 'Galpão de injeção', detalhe: ['6 robôs · 12 injetoras', '27 servomotores · 11 servodrivers'] },
  { se: 'Subestação 2', trafo: '1× 2000 kVA', galpao: 'Galpão de usinagem', detalhe: ['6 robôs', '36 servomotores · 12 servodrivers'] },
  { se: 'Subestação 3', trafo: '2× 2000 kVA', galpao: 'Galpão de acabamento', detalhe: ['13 injetoras', '20 servobombas · 20 servodrivers'] },
  { se: 'Subestação 4', trafo: '2× 750 kVA', galpao: 'Setor administrativo', detalhe: ['servidores, CFTV', 'climatização'] },
];

const Y0 = 60;
const DY = 150;

/** Ponto de proteção (Master Block) — acende em laranja em sequência. */
function Ponto({
  x, y, delay, aceso, label,
}: { x: number; y: number; delay: number; aceso: boolean; label?: string }) {
  return (
    <g
      className="transition-opacity duration-500 ease-premium"
      style={{ opacity: aceso ? 1 : 0.15, transitionDelay: `${delay}s` }}
    >
      <circle cx={x} cy={y} r="15" fill="#F39200" fillOpacity="0.16" />
      <circle cx={x} cy={y} r="8.5" fill="#F39200" />
      <path
        d={`M ${x - 2.2} ${y - 4.6} L ${x + 2.6} ${y - 0.6} L ${x - 0.4} ${y - 0.2} L ${x + 2.2} ${y + 4.6} L ${x - 2.6} ${y + 0.6} L ${x + 0.4} ${y + 0.2} Z`}
        fill="#fff"
      />
      {label && (
        <text x={x} y={y + 30} textAnchor="middle" className="fill-gold" fontSize="11" fontWeight="700">
          {label}
        </text>
      )}
    </g>
  );
}

function Caixa({
  x, y, w, h, titulo, linhas, forte,
}: { x: number; y: number; w: number; h: number; titulo: string; linhas: string[]; forte?: boolean }) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx="10"
        className={forte ? 'fill-deep_navy' : 'fill-[rgb(var(--bg))] stroke-[rgb(var(--border))]'}
        strokeWidth="1.5"
      />
      <text
        x={x + 16} y={y + 26}
        className={forte ? 'fill-white' : 'fill-[rgb(var(--text))]'}
        fontSize="14" fontWeight="700"
      >
        {titulo}
      </text>
      {linhas.map((l, i) => (
        <text
          key={l}
          x={x + 16} y={y + 48 + i * 18}
          className={forte ? 'fill-white/70' : 'fill-[rgb(var(--text-muted))]'}
          fontSize="12"
        >
          {l}
        </text>
      ))}
    </g>
  );
}

export function DiagramaExemploIndustrial() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });

  return (
    <div ref={ref} className="overflow-x-auto">
      <svg
        viewBox="0 0 1060 700"
        className="h-auto w-full min-w-[720px]"
        role="img"
        aria-label="Diagrama de exemplo de uma planta industrial: entrada da concessionária em 69 kV, subestação principal que rebaixa para 13,8 kV, quatro subestações internas com transformadores que alimentam os painéis de baixa tensão de cada galpão, e os pontos de proteção Master Block em cascata na entrada e em cada painel"
      >
        {/* ── Entrada + subestação principal (coluna 1) ─────────── */}
        <Caixa x={16} y={300} w={190} h={78} titulo="Entrada da rede" linhas={['Concessionária · 69 kV']} forte />
        <path d="M 206 339 L 250 339" className="stroke-cyan" strokeWidth="2" fill="none" />
        <Ponto x={228} y={339} delay={0.15} aceso={inView} label="MB" />

        <Caixa
          x={250} y={286} w={210} h={106}
          titulo="Subestação principal"
          linhas={['69 kV → 13,8 kV', 'Trafos + disjuntor geral']}
        />

        {/* Barramento vertical 13,8 kV */}
        <path d="M 460 339 L 505 339" className="stroke-cyan" strokeWidth="2" fill="none" />
        <path d={`M 505 ${Y0 + 39} L 505 ${Y0 + 39 + DY * 3}`} className="stroke-cyan" strokeWidth="2" fill="none" />
        <text x={512} y={332} className="fill-[rgb(var(--text-muted))]" fontSize="11">13,8 kV</text>

        {/* ── Ramos: subestação interna → painel → galpão ───────── */}
        {RAMOS.map((r, i) => {
          const y = Y0 + i * DY;
          const cy = y + 39;
          return (
            <g key={r.se}>
              <path d={`M 505 ${cy} L 548 ${cy}`} className="stroke-cyan" strokeWidth="2" fill="none" />
              <Caixa x={548} y={y} w={186} h={78} titulo={r.se} linhas={[r.trafo, '13,8 kV → 380 V']} />
              <path d={`M 734 ${cy} L 830 ${cy}`} className="stroke-cyan" strokeWidth="2" fill="none" />
              <Ponto x={782} y={cy} delay={0.5 + i * 0.35} aceso={inView} />
              <text x={782} y={cy + 30} textAnchor="middle" className="fill-[rgb(var(--text-muted))]" fontSize="10">
                painel 380 V
              </text>
              <Caixa x={830} y={y} w={214} h={78} titulo={r.galpao} linhas={r.detalhe} />
            </g>
          );
        })}

        {/* Legenda */}
        <g transform="translate(16, 620)">
          <circle cx="10" cy="10" r="8.5" fill="#F39200" />
          <text x="28" y="14" className="fill-[rgb(var(--text-muted))]" fontSize="12">
            Ponto de proteção Master Block (cascata) — exemplo ilustrativo
          </text>
        </g>
      </svg>
    </div>
  );
}
