import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import Link from 'next/link';
import { Tag, Palette, TrendingUp, Factory } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Accordion } from '@/components/ui/Accordion';
import { SOLUTIONS_FAQ } from '@/content/solutionsFaq';

export const metadata: Metadata = {
  title: 'Marcas próprias',
  description:
    'Desenvolva e produza sua marca própria com a estrutura industrial MSM — produção, identidade visual flexível, escala sob demanda e portfólio diversificado.',
  alternates: { canonical: '/solucoes/marcas-proprias' },
  openGraph: {
    title: 'Marcas próprias | MSM Alimentos',
    description:
      'Desenvolva e produza sua marca própria com a estrutura industrial MSM. Produção, identidade flexível e escala sob demanda.',
    url: '/solucoes/marcas-proprias',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

const benefits = [
  { icon: Factory, title: 'Produção industrial completa', description: 'Da formulação ao produto acabado, com toda a infraestrutura produtiva, controles de qualidade e documentação necessários.' },
  { icon: Palette, title: 'Flexibilidade de identidade', description: 'Rótulo, embalagem e apresentação personalizados conforme o posicionamento e o canal de venda da sua marca.' },
  { icon: TrendingUp, title: 'Escala sob demanda', description: 'Volumes ajustáveis à evolução do seu negócio — do lançamento ao crescimento, sem necessidade de mudança de fornecedor.' },
  { icon: Tag, title: 'Portfólio diversificado', description: 'Possibilidade de desenvolver linhas de produtos variadas sob a mesma marca, aproveitando a versatilidade da planta MSM.' },
];

export default function MarcasPropriasPage() {
  return (
    <>
      <PageHero
        eyebrow="Solução"
        title="Marcas Próprias"
        description="Desenvolva e produza sua marca com a estrutura industrial da MSM — identidade exclusiva, qualidade consistente e escala flexível para crescer no mercado."
        breadcrumbs={[{ label: 'Soluções', href: '/solucoes' }, { label: 'Marcas Próprias' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Para distribuidores e redes</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Sua marca, nossa estrutura
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Redes de varejo, distribuidores e atacadistas que querem ter produtos com identidade própria encontram na MSM um parceiro completo: da formulação do produto ao envase com rótulo exclusivo, passando por toda a cadeia de controle de qualidade.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            O modelo de marca própria MSM é pensado para oferecer autonomia de posicionamento ao cliente sem abrir mão da qualidade técnica e da regularidade de abastecimento que o mercado exige.
          </p>
        </div>

        <div className="divider-gradient" />

        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Diferenciais</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              O que torna nossa parceria diferente
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {benefits.map(({ icon: Icon, title, description }) => (
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
              Tire suas dúvidas sobre Marcas Próprias
            </h2>
          </div>
          <Accordion items={SOLUTIONS_FAQ['marcas-proprias']} idPrefix="faq-marcas-proprias" />
        </div>

        <div className="divider-gradient" />

        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Vamos desenvolver sua marca juntos?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Entre em contato e apresente sua ideia. Nossa equipe avalia as possibilidades e apresenta um caminho viável do briefing à prateleira.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Falar sobre marcas próprias"
              context="Solução Marcas Próprias"
              fallbackPath="/contato#terceirizacao"
            />
          </div>
        </div>

      </section>
    </>
  );
}
