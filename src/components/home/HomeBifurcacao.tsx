import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * ⭐ Bifurcação (despachos #15 + #16 + adendos): seção FULL-SCREEN com TRÊS
 * painéis altos — Industrial (parque industrial) · Comercial (supermercado) ·
 * Residencial (EV + mansão), todos foto vertical. Ken Burns sutil, texto
 * sobre scrim, reduced-motion respeitado.
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
    foto: '/home/bifurcacao-industrial-park.webp',
    alt: 'Parque industrial ao entardecer com chaminés',
    // Focal nas chaminés/complexo (não sobra céu vazio no topo).
    fotoPos: 'center 62%',
    titulo: 'Industrial',
    modelo: 'Locação',
    resto:
      ' com direito de saída — estudo, projeto, proposta e instalação sem custo. A primeira mensalidade vence 30 dias depois da instalação, e a partir de 12 meses a Somatec retira sem custo se você não quiser mais.',
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
    cta: { label: 'Ver proteção pro meu negócio', href: '/protecao-comercial' },
  },
  {
    id: 'residencial',
    foto: '/home/bifurcacao-residencial.webp',
    alt: 'Carro elétrico carregando na entrada de uma mansão ao anoitecer',
    titulo: 'Residencial',
    modelo: 'Compra direta',
    resto:
      ' — você mesmo dimensiona a proteção da sua casa em minutos, sem depender de vendedor.',
    cta: { label: 'Ver proteção pra minha casa', href: '/protecao-residencial' },
    // Enquadramento mais alto (feedback do Léo: aparecer mais a casa ao
    // fundo) — ainda pega carro + wallbox na base.
    fotoPos: 'left 42%',
  },
];

export function HomeBifurcacao() {
  return (
    <section
      aria-label="Uma engenharia, três frentes de proteção"
      // ⛔ NÃO amarrar a altura na tela. Era `md:h-[100svh]`, e como o
      // container trava em 1400px os cards ficam sempre com ~460px de largura:
      // num monitor de 1990px de altura eles viravam tiras de 460×1800. A
      // altura agora sai do ASPECTO do próprio card (abaixo), que é o que
      // define se a foto fica proporcional.
      className="flex flex-col"
    >
      <div className="container-msm pt-14 pb-8 md:pt-20 md:pb-10">
        <Reveal>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Uma engenharia, <span className="text-gold">três frentes</span>. Escolha a sua.
          </h2>
        </Reveal>
      </div>

      <div className="container-msm flex-1 pb-10 md:pb-14">
        {/* Painéis com borda UNIFORME de 1px e cantos arredondados nas 4
            pontas cada um (feedback do Léo), separados pela costura mínima. */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
          {CARDS.map(({ id, foto, alt, titulo, modelo, resto, cta, fotoPos }, i) => (
            <Reveal
              key={id}
              delay={i * 90}
              className="group relative min-h-[420px] overflow-hidden rounded-card-lg border border-white/25 md:aspect-[3/4] md:min-h-[520px] md:max-h-[680px]"
            >
              {/* Foto vertical full-bleed + Ken Burns; sem foto ainda =
                  placeholder no mesmo slot. (O painel industrial deixou de
                  usar vídeo — imagem final do parque industrial.) */}
              <div className="absolute inset-0 transition-transform duration-[600ms] ease-premium group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
              {foto ? (
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
              {/* Leve desfoque no fundo SÓ atrás do texto (base), mascarado
                  pra sumir subindo — melhora a leitura sem virar borrão. */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-[3px] [mask-image:linear-gradient(to_top,black_40%,transparent)] [-webkit-mask-image:linear-gradient(to_top,black_40%,transparent)]"
              />
              {/* Scrim — mais denso embaixo, onde vive o texto */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,12,22,0.1)_0%,rgba(1,12,22,0.3)_42%,rgba(1,12,22,0.92)_100%)]"
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
