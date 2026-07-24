import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Módulo NI (#16-H + adendo): 3 cards lado a lado (enche a tela
 * lateralmente), TEXTO DENTRO da foto (scrim), CTA "Ver proteção" →
 * /protecao. O card genérico "Comércio, condomínio e residência" saiu —
 * o comércio agora vive na bifurcação. Copy exata do despacho.
 */

type Painel = {
  id: string;
  /** null = foto do Estúdio pendente → placeholder no mesmo slot. */
  foto: string | null;
  alt: string;
  texto: string;
};

const PAINEIS: readonly Painel[] = [
  {
    id: 'carro-eletrico',
    foto: '/home/ni-carro-eletrico.webp',
    alt: 'Carro elétrico carregando na garagem com carregador de parede',
    texto:
      'O carregador e o carro carregam a noite inteira. Basta um surto pra fritar os dois.',
  },
  {
    id: 'piscina',
    // ⏳ ni-piscina — Estúdio a entregar.
    foto: null,
    alt: 'Piscina aquecida de residência de alto padrão',
    texto:
      'Bomba, aquecedor e trocador de calor vivem ligados. É o conserto mais caro (e mais esquecido) da casa.',
  },
  {
    id: 'elevador',
    // ⏳ ni-elevador — Estúdio a entregar.
    foto: null,
    alt: 'Elevador de condomínio residencial',
    texto:
      'Quando a placa de comando queima, o elevador para — e a conta não estava no orçamento.',
  },
];

export function HomeNiPaineis() {
  return (
    <section aria-label="Proteção não-industrial">
      <div className="container-msm section-y">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PAINEIS.map(({ id, foto, alt, texto }, i) => (
            <Reveal key={id} delay={i * 90}>
              <Link
                href="/protecao"
                className="group relative block h-[300px] overflow-hidden rounded-card-lg md:h-[400px]"
              >
                {foto ? (
                  <Image
                    src={foto}
                    alt={alt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(160deg, rgb(13,41,73) 0%, rgb(7,27,51) 60%, rgb(3,17,31) 100%)',
                    }}
                    aria-hidden="true"
                  />
                )}
                {/* Scrim — denso embaixo, onde vive o texto */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,12,22,0.05)_0%,rgba(1,12,22,0.18)_50%,rgba(1,12,22,0.85)_100%)]"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="font-serif text-lg font-semibold leading-snug text-balance [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] md:text-xl">
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
