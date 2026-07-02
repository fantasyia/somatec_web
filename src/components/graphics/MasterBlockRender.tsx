/**
 * Releitura vetorial (profissional) do produto MasterBlock — usada na hero.
 * SVG nítido em qualquer tamanho, sem artefatos de recorte. Paleta oficial:
 * laranja Master Block + navy/ciano. Substitui a foto recortada do datasheet.
 */
export function MasterBlockRender({ className }: { className?: string }) {
  const FONT = "'Poppins', ui-sans-serif, system-ui, sans-serif";
  return (
    <svg
      viewBox="0 0 680 480"
      role="img"
      aria-label="MasterBlock — supressor de surtos que atua em 100 kHz"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mbFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBB04F" />
          <stop offset="0.5" stopColor="#F7941D" />
          <stop offset="1" stopColor="#EA8600" />
        </linearGradient>
        <linearGradient id="mbBezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EEF1F4" />
          <stop offset="1" stopColor="#C6CBD2" />
        </linearGradient>
        <linearGradient id="mbGland" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4B515A" />
          <stop offset="1" stopColor="#2B2F36" />
        </linearGradient>
        <radialGradient id="mbLed" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#EBFBEF" />
          <stop offset="0.45" stopColor="#3ED06A" />
          <stop offset="1" stopColor="#1C9A42" />
        </radialGradient>
        <filter id="mbShadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="20" stdDeviation="24" floodColor="#00131f" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Prensa-cabos (glândulas) — topo e base, atrás do gabinete */}
      {[200, 340, 480].map((cx) => (
        <rect key={`t${cx}`} x={cx - 17} y={64} width={34} height={46} rx={13} fill="url(#mbGland)" />
      ))}
      {[200, 340, 480].map((cx) => (
        <rect key={`b${cx}`} x={cx - 17} y={370} width={34} height={46} rx={13} fill="url(#mbGland)" />
      ))}

      {/* Gabinete IP-65 */}
      <g filter="url(#mbShadow)">
        <rect x={80} y={96} width={520} height={288} rx={42} fill="url(#mbBezel)" />
        <rect x={104} y={120} width={472} height={240} rx={26} fill="url(#mbFace)" />
        <rect x={104} y={120} width={472} height={240} rx={26} fill="none" stroke="#000000" strokeOpacity={0.12} strokeWidth={2} />
      </g>

      {/* Brilho superior */}
      <rect x={118} y={132} width={444} height={92} rx={20} fill="#ffffff" opacity={0.1} />

      {/* Parafusos de canto */}
      {[[130, 150], [550, 150], [130, 330], [550, 330]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={14} fill="#D7DBE0" stroke="#AEB4BC" strokeWidth={2} />
          <line x1={x - 7} y1={y} x2={x + 7} y2={y} stroke="#9AA1AA" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={x} y1={y - 7} x2={x} y2={y + 7} stroke="#9AA1AA" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}

      {/* Badge de modelo/tensão */}
      <rect x={372} y={150} width={168} height={42} rx={12} fill="#ffffff" fillOpacity={0.16} stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.5} />
      <text x={392} y={178} fontFamily={FONT} fontSize={22} fontWeight={700} fill="#ffffff">MB-01</text>
      <text x={472} y={178} fontFamily={FONT} fontSize={18} fontWeight={600} fill="#ffffff" fillOpacity={0.7}>220V</text>

      {/* LEDs de status */}
      {[392, 442, 492].map((x) => (
        <g key={x}>
          <circle cx={x} cy={262} r={20} fill="#3ED06A" opacity={0.22} />
          <circle cx={x} cy={262} r={12} fill="url(#mbLed)" />
        </g>
      ))}

      {/* Wordmark */}
      <text x={130} y={266} fontFamily={FONT} fontSize={44} fontWeight={800} letterSpacing={1.5} fill="#ffffff">MASTER</text>
      <text x={131} y={312} fontFamily={FONT} fontSize={38} fontWeight={500} fill="#ffffff" fillOpacity={0.92}>Block</text>

      {/* URL */}
      <text x={392} y={318} fontFamily={FONT} fontSize={14} fontWeight={600} fill="#ffffff" fillOpacity={0.55} letterSpacing={0.5}>
        somatecblocking.com.br
      </text>
    </svg>
  );
}
