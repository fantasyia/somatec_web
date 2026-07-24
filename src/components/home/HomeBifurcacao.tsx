import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * ⭐ Bifurcação (despachos #15 + #16-A): seção FULL-SCREEN logo após os
 * logos — a home declara os 2 públicos e os 2 modelos (indústria = locação ·
 * NI = compra direta). 2 cards ALTOS com as fotos VERTICAIS aprovadas, Ken
 * Burns sutil (reduced-motion respeitado) e texto sobre scrim.
 * O painel industrial recebe VÍDEO depois; a still fica de poster/fallback.
 * 1 foco laranja por card = o CTA; a palavra do modelo em negrito claro.
 */

const CARDS = [
  {
    id: 'industria',
    foto: '/home/bifurcacao-industrial.webp',
    alt: 'Planta industrial em operação',
    titulo: 'Para a indústria',
    modelo: 'Locação',
    resto:
      ' com resultado comprovado — estudo, projeto, instalação e teste sem custo. Você só paga a mensalidade se aprovar o resultado na sua operação.',
    cta: { label: 'Ver proteção industrial', href: '#industria' },
  },
  {
    id: 'nao-industrial',
    foto: '/home/bifurcacao-ni.webp',
    alt: 'Casa de alto padrão ao anoitecer',
    titulo: 'Para comércio, condomínio e residência',
    modelo: 'Compra direta',
    resto:
      ' — descubra o modelo certo e o preço na hora, sem esperar vendedor.',
    cta: { label: 'Ver proteção pro meu negócio ou casa', href: '/protecao' },
  },
] as const;

export function HomeBifurcacao() {
  return (
    <section
      aria-label="Duas formas de proteger"
      // ~100svh no desktop (altura DEFINIDA — h-full dos cards resolve);
      // no mobile os 2 cards empilham com altura própria.
      className="flex flex-col md:h-[100svh] md:min-h-[720px]"
    >
      <div className="container-msm pt-14 pb-8 md:pt-20 md:pb-10">
        <Reveal>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Duas formas de proteger. Escolha a sua.
          </h2>
        </Reveal>
      </div>

      <div className="container-msm flex-1 pb-10 md:pb-14">
        <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2">
          {CARDS.map(({ id, foto, alt, titulo, modelo, resto, cta }, i) => (
            <Reveal
              key={id}
              delay={i * 90}
              className="group relative min-h-[420px] overflow-hidden rounded-card-lg md:min-h-0"
            >
              {/* Foto vertical full-bleed + Ken Burns sutil */}
              <div className="absolute inset-0 animate-ken-burns motion-reduce:animate-none">
                <Image
                  src={foto}
                  alt={alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {/* Scrim — denso embaixo, onde vive o texto */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,12,22,0.12)_0%,rgba(1,12,22,0.2)_45%,rgba(1,12,22,0.82)_100%)]"
              />
              <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-8">
                <h3 className="font-serif text-2xl font-semibold text-balance [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] md:text-3xl">
                  {titulo}
                </h3>
                <p className="mt-2 max-w-[440px] text-sm leading-relaxed text-white/85 md:text-base">
                  <strong className="font-semibold text-white">{modelo}</strong>
                  {resto}
                </p>
                <div className="mt-4">
                  <Link href={cta.href} className="btn-primary group/cta inline-flex">
                    {cta.label}
                    <ChevronRight
                      className="h-4 w-4 transition-transform duration-200 ease-premium group-hover/cta:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
