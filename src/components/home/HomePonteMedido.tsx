import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Faixa-ponte (despacho): virada de "isso funciona (gráfico/teoria)" → "isso
 * funcionou de verdade (cases)". Banda NAVY CONTIDA (não full-bleed): conteúdo
 * na largura padrão do site; em telas largas as laterais ficam no navy da
 * seção. Duas colunas — copy à esquerda, imagem como card contido à direita
 * (empilha no mobile: imagem em cima, texto embaixo). 1 foco laranja:
 * "Master Block". Reveal suave (fade+rise), reduced-motion respeitado.
 */
export function HomePonteMedido() {
  return (
    <section aria-label="Resultado na planta do cliente" className="band-navy text-white">
      <div className="container-msm section-y">
        {/* flex-col-reverse no mobile: imagem (última no DOM) em CIMA, copy
            embaixo. md:flex-row: copy à esquerda, imagem à direita. */}
        <div className="flex flex-col-reverse items-center gap-8 md:flex-row md:gap-12">
          {/* Copy */}
          <Reveal className="w-full space-y-4 md:w-1/2">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance leading-tight">
              Menos parada. Menos queima. Menos reprogramação de CLP.
            </h2>
            <p className="max-w-xl leading-relaxed text-white/80">
              É o que o{' '}
              <span className="font-semibold text-gold">Master Block</span> entrega —
              medido na planta de cada cliente, não no laboratório.
            </p>
          </Reveal>

          {/* Imagem como card contido */}
          <Reveal className="w-full md:w-1/2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card-lg border border-white/10 shadow-premium-dark">
              <Image
                src="/home/hero-s1-mbwall.webp"
                alt="Master Block instalado em parede de painel industrial"
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
