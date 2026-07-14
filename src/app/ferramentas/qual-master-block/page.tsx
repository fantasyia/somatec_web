import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { MasterBlockSelector } from '@/components/tools/MasterBlockSelector';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';

export const metadata: Metadata = {
  title: 'Qual Master Block é o meu? Seletor por corrente (MB-01 a MB-12) — Somatec Blocking',
  description:
    'Informe a corrente de carga do seu circuito (A) e descubra na hora o modelo Master Block indicado. Linha de 12 modelos, 110 V a 1100 V, de 1 A a 6300 A. Dimensionamento validado pela engenharia.',
  alternates: { canonical: '/ferramentas/qual-master-block' },
  openGraph: {
    title: 'Seletor Master Block — qual modelo a sua instalação precisa?',
    description: 'Da corrente do circuito ao modelo indicado, em segundos. 12 modelos de 1 A a 6300 A.',
    url: '/ferramentas/qual-master-block',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export default function QualMasterBlockPage() {
  return (
    <>
      <PageHero
        eyebrow="Ferramenta · Dimensionamento"
        title="Qual Master Block a sua instalação precisa?"
        description="A linha tem 12 modelos, todos de 110 V a 1100 V, que mudam pela corrente de carga do circuito. Informe a sua corrente e veja o modelo indicado — o dimensionamento final é validado pela engenharia em proteção em cascata."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Qual Master Block é o meu?' }]}
      />

      <section className="container-msm py-16 md:py-20" aria-label="Seletor de modelo Master Block">
        <Reveal className="mb-8 max-w-3xl space-y-3">
          <span className="eyebrow">Seletor por corrente de carga</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold">
            Da corrente do circuito ao modelo, em segundos
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            O modelo é escolhido pela corrente nominal do circuito a proteger. É uma indicação de
            partida — para o projeto de mitigação de surtos e transientes sob medida, a engenharia
            dimensiona a proteção em cascata (entrada, quadro e equipamento crítico) e o aterramento
            dedicado.
          </p>
        </Reveal>
        <Reveal>
          <MasterBlockSelector />
        </Reveal>

        <Reveal className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-1 font-sans font-semibold text-gold transition-colors hover:text-gold-soft"
          >
            Ver a tabela completa dos 12 modelos
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link
            href="/ferramentas/custo-de-parada"
            className="inline-flex items-center gap-1 font-sans font-semibold text-[rgb(var(--text-muted))] transition-colors hover:text-gold"
          >
            Calcular o custo das paradas
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
