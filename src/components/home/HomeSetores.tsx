import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * "Resultado real, setor por setor" (adendo #16): FUNDE os 4 case-cards com
 * os 4 cards de segmento — mesma informação, uma seção só, na trilha
 * industrial (depois do gráfico −92%). Card = foto + dor + prova + CTA.
 * Regra: 1 foco laranja por card = o NÚMERO da prova; título do setor em
 * navy; CTA em cyan. Dores verificadas no playbook (têxtil corrigida:
 * Grow Up é CONFECÇÃO — costura e bordado, não tinturaria/tecelagem).
 * Selos e linha de clientes vivem no RODAPÉ (trust persistente).
 */

type Setor = {
  nome: string;
  foto: string;
  dor: string;
  /** Prova: [antes do número, NÚMERO (laranja), depois]. */
  prova: [string, string, string];
  href: string;
};

const SETORES: readonly Setor[] = [
  {
    nome: 'Alimentícia',
    foto: '/home/setor-alimenticia.webp',
    dor: 'Linhas de empacotamento e automação parando, com queima de placas.',
    prova: ['Nissin Foods — ', '~R$ 1 mi/ano', ' economizados.'],
    href: '/industrias/alimenticia',
  },
  {
    nome: 'Autopeças',
    foto: '/home/setor-autopecas.webp',
    dor: 'Centros de usinagem (CNC) travando ou reiniciando sozinhos.',
    prova: ['Cinpal — ', '92%', ' de supressão de VTCD.'],
    href: '/industrias/autopecas',
  },
  {
    nome: 'Metalurgia',
    foto: '/home/setor-metalurgia.webp',
    dor: 'Fornos e motores grandes geram surto interno constante.',
    prova: ['Stampline — ', 'R$ 560 mil/ano', ' em placas.'],
    href: '/industrias/metalurgia',
  },
  {
    nome: 'Têxtil',
    foto: '/home/setor-textil.webp',
    dor: 'Máquinas de costura e bordado queimando e parando a confecção.',
    prova: ['Grow Up — ', '4 dias/mês', ' de produção salvos.'],
    href: '/industrias/textil',
  },
];

export function HomeSetores() {
  return (
    <section aria-label="Resultado real, setor por setor">
      <div className="container-msm section-y">
        <Reveal className="max-w-3xl space-y-4 mb-10">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Resultado real, setor por setor
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SETORES.map(({ nome, foto, dor, prova, href }, i) => (
            <Reveal key={nome} delay={i * 70} className="card-elevated flex h-full flex-col overflow-hidden">
              <div className="relative aspect-video w-full overflow-hidden bg-navy-700">
                <Image
                  src={foto}
                  alt={nome}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-5">
                <h3 className="font-sans font-semibold text-base text-[rgb(var(--text))]">{nome}</h3>
                <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{dor}</p>
                <p className="text-sm leading-relaxed text-[rgb(var(--text))] flex-1">
                  {prova[0]}
                  <span className="font-bold text-gold">{prova[1]}</span>
                  {prova[2]}
                </p>
                <Link
                  href={href}
                  className="group inline-flex w-fit items-center gap-1 font-sans text-[13px] font-semibold text-cyan transition-colors hover:text-cyan/80"
                >
                  Ver proteção pra {nome.toLowerCase()}
                  <ChevronRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Selos + "clientes atendidos" foram pro RODAPÉ (trust persistente,
            única instância no site) — aqui fica só a prova no ponto de
            persuasão (números por setor). */}
      </div>
    </section>
  );
}
