import { INDICATORS_FALLBACK } from '@/lib/constants/home-fallback';
import { Reveal } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { ProofBadges } from '@/components/ui/ProofBadges';
import type { HomeIndicator } from '@/types/database';

type Props = { indicators: HomeIndicator[] };

export function HomeIndicators({ indicators }: Props) {
  // Se admin populou home_indicators, exibe esses (com números reais editados).
  // Senão, exibe categorias institucionais sem números inventados (v1.0 §9).
  const useReal = indicators.length > 0;
  const items = useReal
    ? indicators.map((i) => ({
        main: i.main_text,
        label: i.description ?? '',
      }))
    : INDICATORS_FALLBACK.map((i) => ({
        main: i.label,
        label: i.description,
      }));

  return (
    <section
      className="container-msm py-12 md:py-16"
      aria-label="Indicadores institucionais"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-10 sm:gap-x-8 md:gap-x-0 relative">
        {items.map((item, i) => (
          <Reveal
            key={`${item.main}-${i}`}
            delay={i * 80}
            className="relative flex flex-col items-start md:items-center md:text-center md:px-8"
          >
            {/* Divisor vertical com gradient fade (apenas entre colunas, desktop) */}
            {i > 0 && (
              <span
                className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-px"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgb(var(--border)) 50%, transparent 100%)',
                }}
                aria-hidden="true"
              />
            )}
            <div className="font-serif font-semibold text-indicator-m md:text-indicator-d leading-none text-[rgb(var(--text))]">
              {useReal ? <CountUp value={item.main} /> : <span className="text-gold">{item.main}</span>}
            </div>
            {item.label && (
              <div className="mt-3 text-xs md:text-sm uppercase tracking-widest font-sans font-semibold text-[rgb(var(--text-muted))]">
                {item.label}
              </div>
            )}
          </Reveal>
        ))}
      </div>

      {/* Provas reais da Somatec (substitui as certificações de alimentos legadas) */}
      <Reveal className="mt-12 border-t border-[rgb(var(--border))] pt-10">
        <ProofBadges variant="light" />
      </Reveal>
    </section>
  );
}
