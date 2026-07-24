import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Módulo NI mesclado (#16-H): substitui o bloco de 4 cards + a faixa EV
 * separada — o detalhe completo vive na /protecao. 2 fotos lado a lado com o
 * TEXTO DENTRO da foto (scrim pra legibilidade), ambas → /protecao.
 */

const PAINEIS = [
  {
    id: 'comercio-residencia',
    foto: '/home/hero-nao-industrial.webp',
    alt: 'Sala de estar de alto padrão com automação e home theater',
    texto: 'Comércio, condomínio e residência — proteja o que está na tomada.',
  },
  {
    id: 'carro-eletrico',
    foto: '/home/ni-carro-eletrico.webp',
    alt: 'Carro elétrico carregando na garagem com carregador de parede',
    texto: 'Carro elétrico — proteja o carregador e o carro, a noite inteira.',
  },
] as const;

export function HomeNiPaineis() {
  return (
    <section aria-label="Proteção não-industrial">
      <div className="container-msm section-y">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PAINEIS.map(({ id, foto, alt, texto }, i) => (
            <Reveal key={id} delay={i * 90}>
              <Link
                href="/protecao"
                className="group relative block h-[300px] overflow-hidden rounded-card-lg md:h-[380px]"
              >
                <Image
                  src={foto}
                  alt={alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                />
                {/* Scrim — denso embaixo, onde vive o texto */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,12,22,0.05)_0%,rgba(1,12,22,0.15)_50%,rgba(1,12,22,0.82)_100%)]"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-7">
                  <p className="max-w-[440px] font-serif text-xl font-semibold leading-snug text-balance [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] md:text-2xl">
                    {texto}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-gold transition-colors group-hover:text-gold-soft">
                    Ver proteção
                    <ChevronRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={2}
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
