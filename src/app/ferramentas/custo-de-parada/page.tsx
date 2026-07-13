import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { VtcdQuiz } from '@/components/tools/VtcdQuiz';
import { CostCalculator } from '@/components/tools/CostCalculator';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';

export const metadata: Metadata = {
  title: 'Quanto custa sua parada? Calculadora + diagnóstico de VTCD — Somatec Blocking',
  description:
    'Descubra em 2 minutos quanto as paradas e queimas custam por ano na sua operação — e se os sintomas apontam VTCD. Medição gratuita na sua planta.',
  alternates: { canonical: '/ferramentas/custo-de-parada' },
  openGraph: {
    title: 'Calculadora de custo de parada + auto-diagnóstico de VTCD',
    description: 'Coloque seus números e veja o prejuízo anual que a proteção comum não evita.',
    url: '/ferramentas/custo-de-parada',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export default function CustoDeParadaPage() {
  return (
    <>
      <PageHero
        eyebrow="Ferramenta · Diagnóstico"
        title="Quanto a energia suja custa por ano na sua operação?"
        description="Responda 6 perguntas sobre os sintomas da sua planta e coloque 2 números na calculadora — em 2 minutos você sabe o tamanho do prejuízo e se ele tem cara de VTCD."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Custo de parada' }]}
      />

      <section className="container-msm py-16 md:py-20" aria-label="Auto-diagnóstico de VTCD">
        <Reveal className="mb-8 max-w-3xl space-y-3">
          <span className="eyebrow">Passo 1 · Auto-diagnóstico</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold">
            Sua planta tem os sintomas de VTCD?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            VTCD são variações de tensão de curtíssima duração (abaixo de 1 segundo) que DPS,
            no-break e aterramento não pegam — mas que travam máquinas e queimam placas.
          </p>
        </Reveal>
        <Reveal>
          <VtcdQuiz />
        </Reveal>
      </section>

      <section className="container-msm pb-16 md:pb-24" aria-label="Calculadora de custo de parada">
        <Reveal className="mb-8 max-w-3xl space-y-3">
          <span className="eyebrow">Passo 2 · Calculadora</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold">
            O custo real, nos seus números
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Segundo a CNI, 67% da indústria sofre prejuízo com a má qualidade de energia. Use os
            seus próprios números — custo da hora parada e horas de parada por mês — e veja o
            valor que está saindo do seu caixa todo ano.
          </p>
        </Reveal>
        <Reveal>
          <CostCalculator />
        </Reveal>
      </section>
    </>
  );
}
