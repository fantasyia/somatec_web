import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * ⭐ Bifurcação — coração do despacho #15: logo após os logos, a home declara
 * que serve OS DOIS públicos, com os 2 modelos explícitos (INDÚSTRIA =
 * locação · NI = compra direta). 1 foco laranja por card = o CTA; a palavra
 * do modelo vai em navy/negrito.
 */

const CARDS = [
  {
    id: 'industria',
    foto: '/home/seg-metalurgia.webp',
    alt: 'Fornos e motores em planta metalúrgica',
    titulo: 'Para a indústria',
    // "Locação" em navy/negrito (não laranja)
    texto: (
      <>
        <strong className="font-semibold text-[rgb(var(--text))]">Locação</strong>{' '}
        com resultado comprovado — estudo, projeto, instalação e teste sem
        custo. Você só paga a mensalidade se aprovar o resultado na sua
        operação.
      </>
    ),
    cta: { label: 'Ver proteção industrial', href: '#industria' },
  },
  {
    id: 'nao-industrial',
    foto: '/home/hero-nao-industrial.webp',
    alt: 'Sala de estar de alto padrão com automação e home theater',
    titulo: 'Para comércio, condomínio e residência',
    texto: (
      <>
        <strong className="font-semibold text-[rgb(var(--text))]">Compra direta</strong>{' '}
        — descubra o modelo certo e o preço na hora, sem esperar vendedor.
      </>
    ),
    cta: { label: 'Ver proteção pro meu negócio ou casa', href: '/protecao' },
  },
] as const;

export function HomeBifurcacao() {
  return (
    <section aria-label="Duas formas de proteger">
      <div className="container-msm section-y">
        <Reveal className="max-w-3xl space-y-4 mb-10">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Duas formas de proteger. Escolha a sua.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {CARDS.map(({ id, foto, alt, titulo, texto, cta }, i) => (
            <Reveal key={id} delay={i * 80} className="card-elevated flex h-full flex-col overflow-hidden">
              <div className="relative aspect-[16/8] w-full overflow-hidden bg-navy-700">
                <Image
                  src={foto}
                  alt={alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6 md:p-7">
                <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))] md:text-2xl">
                  {titulo}
                </h3>
                <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))] md:text-base flex-1">
                  {texto}
                </p>
                <div>
                  <Link href={cta.href} className="btn-primary group inline-flex">
                    {cta.label}
                    <ChevronRight
                      className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
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
