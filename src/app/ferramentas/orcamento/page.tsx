import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { MasterBlockSelector } from '@/components/tools/MasterBlockSelector';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';

export const metadata: Metadata = {
  title: 'Orçamento Master Block — preço de venda por modelo | Somatec Blocking',
  description:
    'Informe a corrente de carga do seu circuito e veja na hora o modelo Master Block indicado e o preço de venda. Linha de 12 modelos, 110 V a 1100 V.',
  alternates: { canonical: '/ferramentas/orcamento' },
  openGraph: {
    title: 'Orçamento Master Block — modelo indicado + preço',
    description: 'Da corrente do circuito ao modelo e ao preço de venda, em segundos.',
    url: '/ferramentas/orcamento',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export default function OrcamentoPage() {
  return (
    <>
      <PageHero
        title="Seu orçamento Master Block em minutos"
        description="Informe a corrente de carga do circuito e veja na hora o modelo indicado e o preço de venda. Sem reunião, sem espera — deixe seus dados e a Somatec fecha a compra com você."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Orçamento' }]}
      />

      <section className="container-msm py-16 md:py-20" aria-label="Calculadora de orçamento Master Block">
        <Reveal className="mb-8 max-w-3xl space-y-3">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold">
            Da corrente do circuito ao preço, na hora
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            O modelo é escolhido pela corrente nominal do circuito a proteger. Você vê o modelo
            indicado e o preço de venda do equipamento — o dimensionamento final é sempre confirmado
            pela engenharia da Somatec.
          </p>
        </Reveal>
        <Reveal>
          <MasterBlockSelector sourcePage="/ferramentas/orcamento" ctaLabel="Pedir meu orçamento" />
        </Reveal>

        <Reveal className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-1 font-sans font-semibold text-cyan transition-colors hover:text-cyan/80"
          >
            Ver a tabela completa dos 12 modelos
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link
            href="/ferramentas/custo-de-parada"
            className="inline-flex items-center gap-1 font-sans font-semibold text-[rgb(var(--text-muted))] transition-colors hover:text-cyan"
          >
            Calcular o custo das paradas
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
