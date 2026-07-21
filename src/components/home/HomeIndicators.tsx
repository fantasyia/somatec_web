import { INDICATORS_FALLBACK } from '@/lib/constants/home-fallback';
import { Reveal } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
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
      className="container-msm section-y"
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
            {/* Divisor de ritmo — 1px, contraste bem baixo (não cria caixa). */}
            {i > 0 && (
              <span
                className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-px"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgb(var(--border) / 0.55) 50%, transparent 100%)',
                }}
                aria-hidden="true"
              />
            )}
            {/* UM soco laranja por seção (3a): só o índice 1 (ex.: "92%") em
                laranja; os demais em cyan (--gold-soft, legível nos 2 temas).
                whitespace-nowrap + 1 linha → "100 kHz" não quebra e as baselines
                dos 4 ficam alinhadas. */}
            <div
              className={`font-serif font-semibold text-indicator-m md:text-[3.5rem] leading-none whitespace-nowrap ${
                i === 1
                  ? 'text-gold'
                  : 'text-[rgb(var(--gold))] dark:text-[rgb(var(--gold-soft))]'
              }`}
            >
              {useReal ? <CountUp value={item.main} /> : <span>{item.main}</span>}
            </div>
            {item.label && (
              <div className="mt-3 text-xs md:text-sm font-sans font-semibold text-[rgb(var(--text-muted))]">
                {item.label}
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
