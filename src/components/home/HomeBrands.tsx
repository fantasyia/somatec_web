import Image from 'next/image';
import Link from 'next/link';
import { SectionHeading } from './SectionHeading';
import type { Brand } from '@/types/database';

const SLOTS = 6;

type Props = { brands: Brand[] };

export function HomeBrands({ brands }: Props) {
  // Sem marcas cadastradas, não renderiza a seção (evita inventar nomes — v1.0 §9).
  if (brands.length === 0) return null;

  // 6 slots fixos. Slots além das marcas reais ficam como placeholder editorial
  // sutil ("Em breve") — mantém a área visual ocupada sem comprometer com
  // marcas inexistentes.
  const real = brands.slice(0, SLOTS);
  const placeholders = Math.max(0, SLOTS - real.length);

  return (
    <section
      className="bg-[rgb(var(--surface))] border-y border-[rgb(var(--border))]"
      aria-label="Nossas marcas"
    >
      <div className="container-msm py-14 md:py-20">
        <SectionHeading
          eyebrow="Marcas"
          title="Nossas marcas"
          viewAllHref="/marcas"
          viewAllLabel="Ver todas as marcas"
        />

        <div className="grid grid-cols-3 md:grid-cols-6 gap-x-0 gap-y-10">
          {real.map((brand, i) => (
            <Link
              key={brand.id}
              href={`/marcas/${brand.slug}`}
              className="group relative h-20 md:h-24 flex items-center justify-center px-4"
              title={brand.name}
            >
              {i > 0 && (
                <span
                  className="hidden md:block absolute left-0 top-1/4 h-1/2 w-px"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 0%, rgb(var(--border)) 50%, transparent 100%)',
                  }}
                  aria-hidden="true"
                />
              )}
              {brand.logo_url ? (
                <Image
                  src={brand.logo_url}
                  alt={brand.name}
                  width={140}
                  height={64}
                  className="max-h-14 md:max-h-16 w-auto object-contain transition-all duration-300 ease-premium grayscale opacity-65 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-[1.03]"
                />
              ) : (
                <span className="font-serif font-semibold text-base md:text-lg text-[rgb(var(--text-muted))] group-hover:text-gold transition-colors text-center">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}

          {Array.from({ length: placeholders }).map((_, i) => {
            const slotIndex = real.length + i;
            return (
              <div
                key={`placeholder-${i}`}
                className="group relative h-20 md:h-24 flex items-center justify-center px-4"
                aria-hidden="true"
              >
                {slotIndex > 0 && (
                  <span
                    className="hidden md:block absolute left-0 top-1/4 h-1/2 w-px"
                    style={{
                      background:
                        'linear-gradient(180deg, transparent 0%, rgb(var(--border)) 50%, transparent 100%)',
                    }}
                  />
                )}
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[rgb(var(--text-muted))] opacity-40">
                  Em breve
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
