import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import Link from 'next/link';
import { Package, Scale, Scan, Layers } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Accordion } from '@/components/ui/Accordion';
import { SOLUTIONS_FAQ } from '@/content/solutionsFaq';

export const metadata: Metadata = {
  title: 'Envase industrial',
  description:
    'Serviço de envase terceirizado com controle de pesagem, rotulagem e vedação. Diferentes formatos de embalagem para sua marca ou produto industrial.',
  alternates: { canonical: '/solucoes/envase' },
  openGraph: {
    title: 'Envase industrial | MSM Alimentos',
    description:
      'Envase terceirizado com pesagem de precisão, rotulagem e vedação. Diferentes formatos para sua marca ou produto industrial.',
    url: '/solucoes/envase',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

const features = [
  { icon: Layers, title: 'Diferentes formatos', description: 'Capacidade de envase em sachês, potes, embalagens flexíveis e outros formatos, adaptados à necessidade do produto e do canal de venda.' },
  { icon: Scale, title: 'Pesagem de precisão', description: 'Controle gravimétrico e volumétrico que garante conformidade com o conteúdo declarado e reduz variação entre unidades do mesmo lote.' },
  { icon: Scan, title: 'Rotulagem e identificação', description: 'Integração do processo de envase com rotulagem, codificação de lote, validade e demais informações obrigatórias conforme a legislação.' },
  { icon: Package, title: 'Controle de vedação', description: 'Verificação sistemática da integridade do fechamento em cada embalagem, evitando contaminação e preservando a vida útil do produto.' },
];

export default function EnvasePage() {
  return (
    <>
      <PageHero
        eyebrow="Solução"
        title="Envase industrial"
        description="Serviços de envase com controle de peso, vedação e rotulagem integrados — para produtos alimentícios que exigem precisão e conformidade regulatória."
        breadcrumbs={[{ label: 'Soluções', href: '/solucoes' }, { label: 'Envase' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Para quem é</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Envase terceirizado com padrão industrial
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Marcas e distribuidores que possuem formulações próprias mas precisam de estrutura para envasar seus produtos com qualidade encontram na MSM uma solução completa — sem precisar investir em equipamentos ou equipes operacionais.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            O processo de envase MSM é integrado ao controle de qualidade da planta, o que garante rastreabilidade e documentação por lote para atender exigências de auditoria e comercialização.
          </p>
        </div>

        <div className="divider-gradient" />

        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Processo</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Como estruturamos o envase
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
              Tire suas dúvidas sobre Envase
            </h2>
          </div>
          <Accordion items={SOLUTIONS_FAQ['envase']} idPrefix="faq-envase" />
        </div>

        <div className="divider-gradient" />

        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Fale com nossa equipe de envase
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Informe o produto, volume e formato desejado. Nossa equipe avalia a viabilidade e apresenta condições de atendimento.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Solicitar avaliação"
              context="Solução Envase"
              fallbackPath="/contato#envase"
            />
          </div>
        </div>

      </section>
    </>
  );
}
