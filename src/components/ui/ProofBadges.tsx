import { Award, ShieldCheck, BadgeCheck, HardHat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// ProofBadges — as 4 provas REAIS e comprováveis da Somatec, desenhadas na
// marca (navy/ciano, Poppins). Substituem os shields placeholder e as
// certificações de alimentos herdadas da MSM. NÃO incluir ISO 50001 (a
// certificação está EM ANDAMENTO — só texto corrido em outro lugar, nunca selo).
// Fatos fixos da marca — não é conteúdo de admin.
// =============================================================================

type Proof = { Icon: LucideIcon; main: string; sub: string };

/** Exportado p/ a faixa de trust COMPACTA do rodapé (única instância no site). */
export const PROOFS: readonly Proof[] = [
  { Icon: Award, main: 'Prêmio FIESP', sub: 'Acelera Startup 2015' },
  { Icon: ShieldCheck, main: 'DPS Classe III', sub: 'ABNT NBR IEC 61643-1 · NBR 5410' },
  { Icon: BadgeCheck, main: 'Produto patenteado', sub: 'Fabricação exclusiva' },
  { Icon: HardHat, main: '26 anos', sub: 'sem acidente' },
];

type Props = {
  variant?: 'light' | 'dark';
  className?: string;
};

export function ProofBadges({ variant = 'light', className = '' }: Props) {
  const dark = variant === 'dark';

  return (
    <div
      className={`grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 ${className}`}
      aria-label="Provas e reconhecimentos da Somatec"
    >
      {PROOFS.map(({ Icon, main, sub }) => (
        <div
          key={main}
          className={`flex items-center gap-3 p-3.5 md:p-4 ${
            dark
              ? 'rounded-card border border-white/10 bg-white/[0.03] transition-colors duration-200 hover:border-white/25'
              : 'card-elevated'
          }`}
        >
          {/* Sobre navy o ciano puro some — usa o ciano claro (--gold-soft). */}
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn ${
              dark ? 'bg-white/10 text-[rgb(var(--gold-soft))]' : 'bg-cyan/10 text-cyan'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div
              className={`font-serif text-sm font-bold leading-tight tracking-[-0.01em] md:text-[15px] ${
                dark ? 'text-white' : 'text-[rgb(var(--text))]'
              }`}
            >
              {main}
            </div>
            <div className={`mt-0.5 text-[11px] leading-snug md:text-xs ${dark ? 'text-white/55' : 'text-[rgb(var(--text-muted))]'}`}>
              {sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
