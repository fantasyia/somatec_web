/**
 * Marquee "indústrias que confiam" — carrossel infinito e contínuo dos
 * logos oficiais dos clientes reais. Faixa azul (navy) com os logos em
 * versão branca monocromática. Lista duplicada + trilho -50% = loop sem
 * saltos; pausa no hover; respeita prefers-reduced-motion.
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
] as const;

// Lista duplicada para o loop contínuo (-50%).
const TRACK = [...CLIENTS, ...CLIENTS];

export function HomeClients() {
  return (
    <section
      className="border-y border-white/10 bg-navy texture-diagonal"
      aria-label="Indústrias que confiam na Somatec Blocking"
    >
      <div className="py-6 md:py-7">
        <Reveal className="space-y-5">
          <p className="text-center text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-white/55">
            Indústrias que confiam na Somatec Blocking
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
            <ul className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
              {TRACK.map((c, i) => (
                <li
                  key={`${c.name}-${i}`}
                  aria-hidden={i >= CLIENTS.length}
                  className="flex w-[104px] shrink-0 items-center justify-center px-2 md:w-[128px]"
                >
                  <Image
                    src={c.src}
                    alt={c.name}
                    title={c.name}
                    width={500}
                    height={260}
                    className="h-8 w-auto max-w-[92px] object-contain opacity-80 transition duration-300 hover:opacity-100 md:h-9 md:max-w-[112px]"
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
