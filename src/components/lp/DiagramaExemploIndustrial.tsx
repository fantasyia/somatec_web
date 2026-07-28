'use client';

import { useInView } from '@/hooks/useInView';

// =============================================================================
// Diagrama unifilar de EXEMPLO (trilha industrial) — desenho PRÓPRIO da Somatec.
//
// Reproduz a HIERARQUIA COMPLETA de um projeto elétrico real (entrada →
// subestação principal → disjuntores/seccionadoras → subestação por setor →
// painel de baixa → galpão → equipamentos → componentes sensíveis), que é a
// árvore que o wizard faz o visitante remontar.
//
// Por que redesenhado e não a imagem do projeto de um cliente: o documento
// original é de uma planta real. Aqui o layout é outro (o setor administrativo
// desceu pro rodapé), a identidade é a da marca, não há nome de cliente, de
// concessionária ou de unidade — e o desenho mostra os PONTOS DE PROTEÇÃO em
// cascata acendendo em sequência, que o unifilar comum não traz.
//
// prefers-reduced-motion: o guard global zera as transições → estado final direto.
// =============================================================================

type Ramo = {
  se: string;
  trafo: string;
  painel: string;
  galpao: string;
  equipamentos: string;
  componentes: string;
};

const RAMOS: readonly Ramo[] = [
  {
    se: 'Subestação 1',
    trafo: '1× 1000 kVA',
    painel: 'Painel G-A',
    galpao: 'Galpão de injeção',
    equipamentos: '6 robôs · 12 injetoras',
    componentes: '27 servomotores · 11 servodrivers · 1 inversor',
  },
  {
    se: 'Subestação 2',
    trafo: '1× 2000 kVA',
    painel: 'Painel G-B',
    galpao: 'Galpão de usinagem',
    equipamentos: '6 robôs',
    componentes: '36 servomotores · 12 servodrivers',
  },
  {
    se: 'Subestação 3',
    trafo: '2× 2000 kVA',
    painel: 'Painel G-C',
    galpao: 'Galpão de acabamento',
    equipamentos: '13 injetoras',
    componentes: '20 servobombas · 20 servodrivers · 3 inversores',
  },
  {
    se: 'Subestação 4',
    trafo: '2× 750 kVA',
    painel: 'Painel ADM',
    galpao: 'Setor administrativo',
    equipamentos: 'servidores · CFTV',
    componentes: 'climatização · rede',
  },
];

const Y0 = 64;
const DY = 168;
const BUS_X = 548;

/** Ponto de proteção (Master Block) — acende em laranja em sequência. */
function Ponto({
  x, y, delay, aceso, label,
}: { x: number; y: number; delay: number; aceso: boolean; label?: string }) {
  return (
    <g
      className="transition-opacity duration-500 ease-premium"
      style={{ opacity: aceso ? 1 : 0.15, transitionDelay: `${delay}s` }}
    >
      <circle cx={x} cy={y} r="14" fill="#F39200" fillOpacity="0.16" />
      <circle cx={x} cy={y} r="8" fill="#F39200" />
      <path
        d={`M ${x - 2} ${y - 4.3} L ${x + 2.4} ${y - 0.6} L ${x - 0.4} ${y - 0.2} L ${x + 2} ${y + 4.3} L ${x - 2.4} ${y + 0.6} L ${x + 0.4} ${y + 0.2} Z`}
        fill="#fff"
      />
      {label && (
        <text x={x} y={y + 27} textAnchor="middle" className="fill-gold" fontSize="10.5" fontWeight="700">
          {label}
        </text>
      )}
    </g>
  );
}

function Caixa({
  x, y, w, h, titulo, linhas, forte, tituloPequeno,
}: {
  x: number; y: number; w: number; h: number;
  titulo: string; linhas: string[]; forte?: boolean; tituloPequeno?: boolean;
}) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx="9"
        className={forte ? 'fill-deep_navy' : 'fill-[rgb(var(--bg))] stroke-[rgb(var(--border))]'}
        strokeWidth="1.5"
      />
      <text
        x={x + 13} y={y + 21}
        className={forte ? 'fill-white' : 'fill-[rgb(var(--text))]'}
        fontSize={tituloPequeno ? 11 : 12.5}
        fontWeight="700"
      >
        {titulo}
      </text>
      {linhas.map((l, i) => (
        <text
          key={l}
          x={x + 13} y={y + 39 + i * 15}
          className={forte ? 'fill-white/70' : 'fill-[rgb(var(--text-muted))]'}
          fontSize="10.5"
        >
          {l}
        </text>
      ))}
    </g>
  );
}

export function DiagramaExemploIndustrial() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div ref={ref} className="overflow-x-auto">
      <svg
        viewBox="0 0 1240 760"
        className="h-auto w-full min-w-[980px]"
        role="img"
        aria-label="Diagrama unifilar de exemplo de uma planta industrial: entrada da concessionária em 69 kV, subestação principal que rebaixa para 13,8 kV, bloco de disjuntores e seccionadoras, quatro subestações internas com transformadores, os painéis de baixa tensão de cada galpão e os equipamentos com seus componentes sensíveis. Os pontos de proteção Master Block ficam na entrada e em cada painel."
      >
        {/* ── Entrada ─────────────────────────────────────────────── */}
        <Caixa x={16} y={300} w={176} h={74} titulo="Entrada da rede" linhas={['Concessionária', '69 kV']} forte />
        <path d="M 192 337 L 232 337" className="stroke-cyan" strokeWidth="2" fill="none" />
        <Ponto x={212} y={337} delay={0.15} aceso={inView} label="MB" />

        {/* ── Subestação principal ────────────────────────────────── */}
        <Caixa
          x={232} y={286} w={196} h={102}
          titulo="Subestação principal"
          linhas={['69 kV → 13,8 kV', 'Transformadores', 'Disjuntor geral']}
        />
        <path d="M 428 337 L 452 337" className="stroke-cyan" strokeWidth="2" fill="none" />

        {/* ── Bloco de manobra (disjuntores + seccionadoras) ──────── */}
        <Caixa
          x={452} y={296} w={72} h={82}
          titulo="Manobra"
          linhas={['Disjuntores', 'Seccionadoras', '13,8 kV']}
          tituloPequeno
        />
        <path d={`M 524 337 L ${BUS_X} 337`} className="stroke-cyan" strokeWidth="2" fill="none" />

        {/* Barramento 13,8 kV que desce pras subestações */}
        <path
          d={`M ${BUS_X} ${Y0 + 34} L ${BUS_X} ${Y0 + DY * 3 + 34}`}
          className="stroke-cyan"
          strokeWidth="2"
          fill="none"
        />

        {/* ── Ramos: subestação → painel de baixa → galpão ────────── */}
        {RAMOS.map((r, i) => {
          const y = Y0 + i * DY;
          const cy = y + 34;
          return (
            <g key={r.se}>
              <path d={`M ${BUS_X} ${cy} L 572 ${cy}`} className="stroke-cyan" strokeWidth="2" fill="none" />
              <Caixa x={572} y={y} w={180} h={68} titulo={r.se} linhas={[r.trafo, '13,8 kV → 380 V']} />

              {/* Painel de baixa — é aqui que entra o MB da camada */}
              <path d={`M 752 ${cy} L 812 ${cy}`} className="stroke-cyan" strokeWidth="2" fill="none" />
              <Ponto x={782} y={cy} delay={0.5 + i * 0.3} aceso={inView} />
              <Caixa x={812} y={y + 6} w={112} h={56} titulo={r.painel} linhas={['380 V']} tituloPequeno />

              {/* Galpão + equipamentos → componentes sensíveis */}
              <path d={`M 924 ${cy} L 952 ${cy}`} className="stroke-cyan" strokeWidth="2" fill="none" />
              <Caixa
                x={952} y={y - 4} w={272} h={76}
                titulo={r.galpao}
                linhas={[r.equipamentos, `→ ${r.componentes}`]}
              />
            </g>
          );
        })}

        {/* Legenda */}
        <g transform="translate(16, 706)">
          <circle cx="9" cy="9" r="8" fill="#F39200" />
          <text x="26" y="13" className="fill-[rgb(var(--text-muted))]" fontSize="11.5">
            Ponto de proteção Master Block (cascata) — exemplo ilustrativo, sem dados de cliente
          </text>
        </g>
      </svg>
    </div>
  );
}
