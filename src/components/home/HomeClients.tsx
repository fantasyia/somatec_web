/**
 * Mural "indústrias que confiam" — prova social logo abaixo da hero.
 * Logos oficiais dos clientes reais (cases comprovados), obtidos do próprio
 * site da Somatec Blocking. Faixa branca para os logos (fundo branco)
 * blendarem; grayscale por padrão, cor no hover.
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

export function HomeClients() {
  return (
    <section
      className="border-b border-black/5 bg-white"
      aria-label="Indústrias que confiam na Somatec Blocking"
    >
      <div className="container-msm py-10 md:py-12">
        <Reveal className="space-y-8">
          <p className="text-center text-[11px] md:text-xs font-sans font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Indústrias que confiam na Somatec Blocking
          </p>
          <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 items-center justify-items-center gap-x-6 gap-y-6">
            {CLIENTS.map((c) => (
              <li key={c.name}>
                <Image
                  src={c.src}
                  alt={c.name}
                  title={c.name}
                  width={500}
                  height={500}
                  className="h-16 w-16 md:h-20 md:w-20 object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
