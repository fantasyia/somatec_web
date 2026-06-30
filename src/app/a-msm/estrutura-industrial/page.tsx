import type { Metadata } from 'next';
import Link from 'next/link';
import { Layers, Thermometer, BarChart3, Truck } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';

export const metadata: Metadata = {
  title: 'Estrutura industrial — A MSM',
  robots: { index: true, follow: true },
};

const capabilities = [
  {
    icon: Layers,
    title: 'Linhas de produção',
    description:
      'Múltiplas linhas produtivas para diferentes categorias de alimentos, com flexibilidade para atender formulações e formatos variados conforme a demanda do cliente.',
  },
  {
    icon: Thermometer,
    title: 'Controle de processo',
    description:
      'Monitoramento contínuo de temperatura, umidade e parâmetros críticos em cada etapa, garantindo padrão e consistência de lote a lote.',
  },
  {
    icon: BarChart3,
    title: 'Rastreabilidade',
    description:
      'Sistema de rastreabilidade integrado que permite acompanhar a origem de cada matéria-prima e o histórico completo de cada produto fabricado.',
  },
  {
    icon: Truck,
    title: 'Logística integrada',
    description:
      'Estrutura de expedição e controle de estoque preparada para atender volumes B2B com agilidade e organização na cadeia de distribuição.',
  },
];

export default function EstruturaIndustrialPage() {
  return (
    <>
      <PageHero
        eyebrow="A MSM"
        title="Estrutura industrial"
        description="Infraestrutura produtiva e tecnológica dimensionada para atender o mercado B2B com escala, precisão e controle de processo em cada etapa."
        breadcrumbs={[{ label: 'A MSM', href: '/a-msm' }, { label: 'Estrutura industrial' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        {/* Intro editorial */}
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Capacidade produtiva</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Produção industrial preparada para escala
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            A MSM opera com uma planta industrial estruturada para atender diferentes segmentos do mercado alimentício, combinando capacidade de escala com flexibilidade para desenvolver produtos sob medida — seja para marcas próprias, terceirização ou abastecimento de grandes redes e distribuidores.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Nossa estrutura é desenhada para garantir consistência em produções de alto volume, com processos padronizados e controle rigoroso em cada ponto crítico da cadeia.
          </p>
        </div>

        <div className="divider-gradient" />

        {/* Capabilities grid */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Diferenciais</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              O que estrutura nossa operação
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex gap-5 p-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
              >
                <Icon
                  className="h-7 w-7 text-gold shrink-0 mt-0.5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <div className="space-y-1.5">
                  <h3 className="font-sans font-semibold text-[rgb(var(--text))]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="divider-gradient" />

        {/* CTA */}
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Quer saber se atendemos a sua demanda?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Entre em contato com nossa equipe para discutir volumes, formatos e possibilidades de parceria industrial.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Falar com a equipe"
              context="Estrutura industrial MSM"
              fallbackPath="/contato#b2b"
            />
            <Link href="/solucoes/terceirizacao-de-producao" className="btn-secondary text-[rgb(var(--text))]">
              Terceirização
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
