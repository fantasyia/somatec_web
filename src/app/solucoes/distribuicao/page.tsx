import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import Link from 'next/link';
import { ArrowRight, Truck, MapPin, Clock, BarChart3 } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Accordion } from '@/components/ui/Accordion';
import { SOLUTIONS_FAQ } from '@/content/solutionsFaq';

export const metadata: Metadata = {
  title: 'Distribuição',
  description:
    'Distribuição estruturada de produtos MSM em todo o Brasil. Cobertura nacional, planejamento de entrega e relacionamento com representantes e distribuidores.',
  alternates: { canonical: '/solucoes/distribuicao' },
  openGraph: {
    title: 'Distribuição | MSM Alimentos',
    description:
      'Distribuição estruturada em todo o Brasil. Cobertura nacional e relacionamento com representantes e distribuidores parceiros.',
    url: '/solucoes/distribuicao',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

const features = [
  { icon: MapPin, title: 'Cobertura nacional', description: 'Atendimento a distribuidores e parceiros em diferentes regiões do Brasil, com logística estruturada para reduzir prazo e custo de frete.' },
  { icon: Clock, title: 'Planejamento de entrega', description: 'Programação de pedidos e prazos de entrega alinhados ao ciclo de abastecimento do cliente, evitando rupturas de estoque.' },
  { icon: BarChart3, title: 'Controle de estoque', description: 'Gestão de picking e expedição organizada para garantir que cada pedido saia correto, com documentação fiscal adequada.' },
  { icon: Truck, title: 'Parceiros logísticos', description: 'Rede de transportadoras e operadores logísticos selecionados para garantir integridade do produto durante o transporte.' },
];

export default function DistribuicaoPage() {
  return (
    <>
      <PageHero
        eyebrow="Solução"
        title="Distribuição"
        description="Logística de distribuição estruturada para levar os produtos MSM a distribuidores, redes e parceiros comerciais em todo o Brasil com agilidade e organização."
        breadcrumbs={[{ label: 'Soluções', href: '/solucoes' }, { label: 'Distribuição' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Alcance nacional</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Distribuição que acompanha o seu crescimento
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            A MSM distribui seus produtos para distribuidores, atacados e redes de varejo em diferentes estados do Brasil. Nossa operação de expedição é estruturada para garantir que cada pedido chegue no prazo combinado, com a documentação correta e a integridade do produto preservada.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Para distribuidores interessados em representar ou revender os produtos MSM, nossa equipe comercial está disponível para apresentar condições, territórios e política comercial.
          </p>
        </div>

        <div className="divider-gradient" />

        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Estrutura logística</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Como organizamos a distribuição
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-6 md:gap-7 p-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                <Icon className="h-8 w-8 text-gold shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
                <div className="space-y-1.5">
                  <h3 className="font-sans font-semibold text-xl md:text-[1.375rem] text-[rgb(var(--text))]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="divider-gradient" />

        <div className="max-w-3xl mx-auto">
          <div className="mb-8 md:mb-10 text-center">
            <span className="eyebrow">Perguntas frequentes</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Tire suas dúvidas sobre Distribuição
            </h2>
          </div>
          <Accordion items={SOLUTIONS_FAQ['distribuicao']} idPrefix="faq-distribuicao" />
        </div>

        <div className="divider-gradient" />

        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Quer ser um distribuidor MSM?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Fale com nossa equipe comercial para conhecer a política de distribuição, territórios disponíveis e condições de parceria.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/representantes" className="btn-primary">
              Seja um representante
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <CommercialCta
              label="Contato comercial"
              context="Distribuição"
              fallbackPath="/contato#b2b"
              variant="secondary"
              withArrow={false}
              className="text-[rgb(var(--text))]"
            />
          </div>
        </div>

      </section>
    </>
  );
}
