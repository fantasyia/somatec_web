import Link from 'next/link';
import { ChevronRight, Store, Home, Building2, Factory } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import type { LucideIcon } from 'lucide-react';

/**
 * Bloco-ponte NI (não-industrial) — despacho #5: mostra O QUE ESTÁ EM RISCO
 * em cada público (4 mini-cards compactos), não só quem são. Mesmo destino do
 * slide NI do hero: a calculadora (/ferramentas/orcamento).
 */

type Publico = {
  Icon: LucideIcon;
  nome: string;
  texto: string;
};

const PUBLICOS: readonly Publico[] = [
  {
    Icon: Store,
    nome: 'Comércio',
    texto:
      'Freezer, câmara fria, PDV e ar-condicionado. Um dia parado no comércio pesa igual ao de uma fábrica.',
  },
  {
    Icon: Home,
    nome: 'Casa e apartamento',
    texto:
      'Automação, home theater, ar-condicionado e inversor solar — o patrimônio eletrônico da casa, todo ligado na mesma rede.',
  },
  {
    Icon: Building2,
    nome: 'Condomínio',
    texto:
      'Bombas, elevador, portaria e CFTV — a manutenção que ninguém previu no orçamento.',
  },
  {
    Icon: Factory,
    nome: 'Pequena indústria',
    texto: 'A mesma dor da grande, em escala menor — e com compra direta.',
  },
];

export function HomeNaoIndustrial() {
  return (
    <section aria-label="Proteção para comércio, condomínio e residência">
      <div className="container-msm section-y">
        <Reveal className="max-w-3xl space-y-4 mb-8">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Proteção também pra comércio, condomínio e casa de alto padrão
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PUBLICOS.map(({ Icon, nome, texto }, i) => (
            <Reveal
              key={nome}
              delay={i * 70}
              className="rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 h-full"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-btn bg-cyan/15 text-cyan mb-3">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="font-sans font-semibold text-sm text-[rgb(var(--text))]">
                {nome}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                {texto}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8">
          <Link href="/ferramentas/orcamento" className="btn-primary group inline-flex">
            Calcular a minha proteção
            <ChevronRight
              className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
