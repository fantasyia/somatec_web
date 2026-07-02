/**
 * Marquee "indústrias que confiam" — carrossel infinito e contínuo dos
 * logos oficiais dos clientes reais (obtidos do site da Somatec). A lista é
 * duplicada e o trilho anda -50% em loop: emenda perfeita, sem saltos.
 * Pausa no hover; respeita prefers-reduced-motion.
 */
import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

const CLIENTS = [
  { src: '/clientes/basf.jpg', name: 'BASF' },
  { src: '/clientes/bosch.jpg', name: 'Bosch' },
  { src: '/clientes/philips.jpg', name: 'Philips' },
  { src: '/clientes/colgate.jpg', name: 'Colgate' },
  { src: '/clientes/johnson.jpg', name: 'Johnson Controls' },
  { src: '/clientes/ambev.jpg', name: 'Ambev' },
  { src: '/clientes/saint-gobain.jpg', name: 'Saint-Gobain' },
  { src: '/clientes/medley.jpg', name: 'Medley' },
  { src: '/clientes/akzo-nobel.jpg', name: 'AkzoNobel' },
  { src: '/clientes/nissin.png', name: 'Nissin Foods' },
  { src: '/clientes/acrilex.jpg', name: 'Acrilex' },
  { src: '/clientes/cinpal.png', name: 'Cinpal' },
  { src: '/clientes/grow-up.jpg', name: 'Grow Up' },
  { src: '/clientes/stampline.png', name: 'Stampline' },
  { src: '/clientes/kostal.jpg', name: 'Kostal' },
  { src: '/clientes/lorenzetti.jpg', name: 'Lorenzetti' },
  { src: '/clientes/moura.jpg', name: 'Moura' },
] as const;

// Lista duplicada para o loop contínuo (-50%).
const TRACK = [...CLIENTS, ...CLIENTS];

export function HomeClients() {
  return (
    <section
      className="border-b border-black/5 bg-white"
      aria-label="Indústrias que confiam na Somatec Blocking"
    >
      <div className="py-10 md:py-12">
        <Reveal className="space-y-8">
          <p className="text-center text-[11px] md:text-xs font-sans font-semibold uppercase tracking-[0.16em] text-neutral-500">
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
                  className="flex w-[130px] shrink-0 items-center justify-center px-2 md:w-[170px]"
                >
                  <Image
                    src={c.src}
                    alt={c.name}
                    title={c.name}
                    width={500}
                    height={500}
                    className="h-16 w-auto max-w-[120px] object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:h-20 md:max-w-[150px]"
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
