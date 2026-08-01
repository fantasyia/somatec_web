/**
 * Marquee "empresas que confiam" — carrossel infinito e contínuo dos logos
 * oficiais dos clientes reais (29, todos autorizados). Lista duplicada +
 * trilho -50% = loop sem saltos; pausa no hover; respeita
 * prefers-reduced-motion.
 *
 * Título fala EMPRESAS, não "indústrias": a lista inclui varejo (Shopping
 * Vitória) e o site atende comércio, condomínio e residência — "indústrias"
 * era factualmente errado e jogava fora prova social pro público não-industrial.
 */
import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

const CLIENTS = [
  { src: '/clientes/basf-w.png', name: 'BASF' },
  { src: '/clientes/bosch-w.png', name: 'Bosch' },
  { src: '/clientes/philips-w.png', name: 'Philips' },
  { src: '/clientes/colgate-w.png', name: 'Colgate' },
  { src: '/clientes/johnson-w.png', name: 'Johnson Controls' },
  { src: '/clientes/ambev-w.png', name: 'Ambev' },
  { src: '/clientes/saint-gobain-w.png', name: 'Saint-Gobain' },
  { src: '/clientes/medley-w.png', name: 'Medley' },
  { src: '/clientes/akzo-nobel-w.png', name: 'AkzoNobel' },
  { src: '/clientes/nissin-w.png', name: 'Nissin Foods' },
  { src: '/clientes/acrilex-w.png', name: 'Acrilex' },
  { src: '/clientes/cinpal-w.png', name: 'Cinpal' },
  { src: '/clientes/grow-up-w.png', name: 'Grow Up' },
  { src: '/clientes/stampline-w.png', name: 'Stampline' },
  { src: '/clientes/kostal-w.png', name: 'Kostal' },
  { src: '/clientes/lorenzetti-w.png', name: 'Lorenzetti' },
  { src: '/clientes/moura-w.png', name: 'Moura' },
  // +12 do site antigo (todos autorizados, confirmado 2026-07-28).
  { src: '/clientes/penha-w.png', name: 'Penha' },
  { src: '/clientes/nova-plast-w.png', name: 'Nova Plast' },
  { src: '/clientes/shopping-vitoria-w.png', name: 'Shopping Vitória' },
  { src: '/clientes/buaiz-w.png', name: 'Buaiz Alimentos' },
  { src: '/clientes/general-w.png', name: 'General Produtos Poliméricos' },
  { src: '/clientes/sibelco-w.png', name: 'Sibelco' },
  { src: '/clientes/chassis-brakes-w.png', name: 'Chassis Brakes International' },
  { src: '/clientes/ical-w.png', name: 'Ical' },
  { src: '/clientes/tilibra-w.png', name: 'Tilibra' },
  { src: '/clientes/ophthalmos-w.png', name: 'Ophthalmos Rohto' },
  { src: '/clientes/new-oldany-w.png', name: 'New Oldany' },
  { src: '/clientes/ferraz-maquinas-w.png', name: 'Ferraz Máquinas' },
] as const;

// Lista duplicada para o loop contínuo (-50%).
const TRACK = [...CLIENTS, ...CLIENTS];

export function HomeClients() {
  return (
    <section
      className="border-y border-[rgb(var(--border))] tone-surface"
      aria-label="Empresas que confiam na Somatec Blocking"
    >
      <div className="py-6 md:py-7">
        <Reveal className="space-y-5">
          <p className="text-center text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
            Empresas que confiam na Somatec Blocking
          </p>

          <div
            className="group relative overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
            }}
          >
            {/* Espaçamento: gap CONSTANTE, não slot de largura fixa. Com slot
                fixo, logo estreita sobrava espaço dos dois lados e logo larga
                encostava nas vizinhas — o vão entre as marcas variava. Agora
                cada item tem a largura da própria logo e o respiro é sempre o
                mesmo. */}
            <ul className="flex w-max items-center gap-11 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none md:gap-14">
              {TRACK.map((c, i) => (
                <li
                  key={`${c.name}-${i}`}
                  aria-hidden={i >= CLIENTS.length}
                  className="flex shrink-0 items-center justify-center"
                >
                  <Image
                    src={c.src}
                    alt={c.name}
                    title={c.name}
                    width={500}
                    height={260}
                    className="h-8 w-auto max-w-[124px] object-contain brightness-0 opacity-55 transition duration-300 hover:opacity-100 dark:brightness-100 dark:opacity-80 md:h-9 md:max-w-[148px]"
                  />
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
