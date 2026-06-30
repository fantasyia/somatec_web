import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';

export const metadata: Metadata = {
  title: 'Quem somos — A MSM',
  robots: { index: true, follow: true },
};

const values = [
  { title: 'Qualidade', description: 'Rigor técnico em cada etapa do processo produtivo, do ingrediente ao produto final.' },
  { title: 'Parceria', description: 'Relação próxima e transparente com clientes, fornecedores e colaboradores.' },
  { title: 'Consistência', description: 'Entrega padronizada e confiável em escala, seja para pequenas ou grandes operações.' },
  { title: 'Inovação', description: 'Investimento contínuo em tecnologia, processos e desenvolvimento de novas soluções.' },
];

export default function QuemSomosPage() {
  return (
    <>
      <PageHero
        eyebrow="A MSM"
        title="Quem somos"
        description="Uma indústria alimentícia construída sobre rigor técnico, parcerias de longo prazo e compromisso com a qualidade em cada etapa da produção."
        breadcrumbs={[{ label: 'A MSM', href: '/a-msm' }, { label: 'Quem somos' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        {/* Missão e visão */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16">
          <div className="space-y-4">
            <span className="eyebrow">Missão</span>
            <h2 className="font-serif text-h3-m md:text-h3-d font-semibold text-balance">
              Gerar valor para o ecossistema alimentício
            </h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              A MSM atua como elo estratégico entre a produção industrial de alimentos e as demandas do mercado B2B nacional, oferecendo soluções integradas que vão da fabricação ao desenvolvimento de marcas próprias.
            </p>
          </div>
          <div className="space-y-4">
            <span className="eyebrow">Visão</span>
            <h2 className="font-serif text-h3-m md:text-h3-d font-semibold text-balance">
              Referência em soluções industriais para alimentos
            </h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Ser reconhecida como a parceira mais confiável para empresas que precisam de capacidade industrial, qualidade consistente e flexibilidade para crescer com segurança.
            </p>
          </div>
        </div>

        <div className="divider-gradient" />

        {/* Valores */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Nossos valores</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              O que guia cada decisão
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map(({ title, description }) => (
              <div
                key={title}
                className="p-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
              >
                <h3 className="font-sans font-semibold text-lg mb-2 text-[rgb(var(--text))]">{title}</h3>
                <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="divider-gradient" />

        {/* CTA */}
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Pronto para conhecer nossas soluções?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Fale com nossa equipe comercial e descubra como a MSM pode ser a parceira ideal para o seu negócio.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Falar com a equipe"
              fallbackPath="/contato#b2b"
            />
            <Link href="/solucoes" className="btn-secondary text-[rgb(var(--text))]">
              Ver soluções
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
