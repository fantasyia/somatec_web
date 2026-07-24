import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BifurcacaoVideo } from '@/components/home/BifurcacaoVideo';
import { Reveal } from '@/components/ui/Reveal';

/**
 * ⭐ Bifurcação (despachos #15 + #16 + adendos): seção FULL-SCREEN com TRÊS
 * painéis altos — Industrial (vídeo em loop no desktop) · Comercial (foto de
 * supermercado, vertical) · Residencial (bifurcacao-ni). Ken Burns sutil nas
 * stills, texto sobre scrim, reduced-motion respeitado.
 * Modelo em negrito claro; 1 foco laranja por card = o CTA.
 * ⚠️ Copy dos cards Comercial/Residencial DERIVADA dos textos já aprovados
 * (grade da landing /protecao) — o despacho trouxe só a foto; master valida.
 */

type Card = {
  id: string;
  /** null = foto do Estúdio pendente → placeholder no mesmo slot. */
  foto: string | null;
  alt: string;
  titulo: string;
  modelo: string;
  resto: string;
  cta: { label: string; href: string };
  /** object-position custom (default center) — enquadra a ação da foto. */
  fotoPos?: string;
};

const CARDS: readonly Card[] = [
  {
    id: 'industria',
    foto: '/home/bifurcacao-industrial.webp',
    alt: 'Planta industrial em operação',
    titulo: 'Industrial',
    modelo: 'Locação',
    resto:
      ' com resultado comprovado — estudo, projeto, instalação e teste sem custo. Você só paga a mensalidade se aprovar o resultado na sua operação.',
    cta: { label: 'Ver proteção industrial', href: '#industria' },
  },
  {
    id: 'comercio',
    foto: '/home/bifurcacao-comercial.webp',
    alt: 'Supermercado com refrigeração e PDV',
    titulo: 'Comercial',
    modelo: 'Compra direta',
    resto:
      ' — forno da padaria, câmara fria do restaurante, PDV da loja, ar-condicionado do consultório: um dia parado pesa igual ao de uma fábrica.',
    cta: { label: 'Ver proteção pro meu negócio', href: '/protecao' },
  },
  {
    id: 'residencial',
    foto: '/home/bifurcacao-residencial.webp',
    alt: 'Carro elétrico carregando na entrada de uma mansão ao anoitecer',
    titulo: 'Residencial',
    modelo: 'Compra direta',
    resto:
      ' — automação, home theater, ar-condicionado e inversor solar: o patrimônio eletrônico da casa, todo na mesma rede.',
    cta: { label: 'Ver proteção pra minha casa', href: '/protecao' },
    // Foco na metade inferior-esquerda (carro + wallbox), não corta a ação.
    fotoPos: 'left 70%',
  },
];

export function HomeBifurcacao() {
  return (
    <section
      aria-label="Duas formas de proteger"
      // ~100svh no desktop (altura DEFINIDA — h-full dos cards resolve);
      // no mobile os cards empilham com altura própria.
      className="flex flex-col md:h-[100svh] md:min-h-[720px]"
    >
      <div className="container-msm pt-14 pb-8 md:pt-20 md:pb-10">
        <Reveal>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Duas formas de <span className="text-gold">proteger</span>. Escolha a sua.
          </h2>
        </Reveal>
      </div>

      <div className="container-msm flex-1 pb-10 md:pb-14">
        {/* Painéis com borda UNIFORME de 1px e cantos arredondados nas 4
            pontas cada um (feedback do Léo), separados pela costura mínima. */}
        <div className="grid h-full grid-cols-1 gap-1 md:grid-cols-3">
          {CARDS.map(({ id, foto, alt, titulo, modelo, resto, cta, fotoPos }, i) => (
            <Reveal
              key={id}
              delay={i * 90}
              className="group relative min-h-[420px] overflow-hidden rounded-card-lg border border-white/25 md:min-h-0"
            >
              {/* Painel industrial: VÍDEO em loop no desktop (still no mobile
                  e sob reduced-motion). Demais: foto vertical + Ken Burns;
                  sem foto ainda = placeholder no mesmo slot. */}
              <div className="absolute inset-0 transition-transform duration-[600ms] ease-premium group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
              {id === 'industria' ? (
                <BifurcacaoVideo />
              ) : foto ? (
                <div className="absolute inset-0 animate-ken-burns motion-reduce:animate-none">
                  <Image
                    src={foto}
                    alt={alt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={fotoPos ? { objectPosition: fotoPos } : undefined}
                    className="object-cover"
                  />
                </div>
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
              </div>
              {/* Scrim — denso embaixo, onde vive o texto */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,12,22,0.12)_0%,rgba(1,12,22,0.2)_45%,rgba(1,12,22,0.85)_100%)]"
              />
              <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-7">
                <h3 className="font-serif text-xl font-semibold text-balance [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] md:text-2xl">
                  {titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
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
