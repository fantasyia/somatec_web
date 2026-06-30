import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import Link from 'next/link';
import { ChefHat, Clock, Package, BarChart3 } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Accordion } from '@/components/ui/Accordion';
import { SOLUTIONS_FAQ } from '@/content/solutionsFaq';

export const metadata: Metadata = {
  title: 'Food Service',
  description:
    'Insumos industriais para cozinhas profissionais — formulações consistentes, embalagens otimizadas e abastecimento regular para restaurantes, redes e cozinhas centrais.',
  alternates: { canonical: '/solucoes/food-service' },
  openGraph: {
    title: 'Food Service | MSM Alimentos',
    description:
      'Insumos industriais para cozinhas profissionais — formulações consistentes, embalagens otimizadas e abastecimento regular para restaurantes e redes.',
    url: '/solucoes/food-service',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

const benefits = [
  { icon: ChefHat, title: 'Produtos para cozinhas profissionais', description: 'Formulações e embalagens pensadas para operação em escala, com rendimento previsível e padronização de sabor.' },
  { icon: Package, title: 'Formatos adequados para a operação', description: 'Embalagens bulk e formatos industriais que facilitam o trabalho da cozinha, reduzem desperdício e otimizam o estoque.' },
  { icon: Clock, title: 'Regularidade de abastecimento', description: 'Cadência de entrega planejada para garantir que sua operação nunca fique sem insumos essenciais.' },
  { icon: BarChart3, title: 'Suporte técnico e comercial', description: 'Equipe disponível para auxiliar na escolha dos produtos certos, cálculo de rendimento e adequação às necessidades da sua operação.' },
];

export default function FoodServicePage() {
  return (
    <>
      <PageHero
        eyebrow="Solução"
        title="Food Service"
        description="Produtos e soluções desenvolvidos para atender as exigências da operação de food service em escala — de restaurantes independentes a grandes redes e cozinhas centrais."
        breadcrumbs={[{ label: 'Soluções', href: '/solucoes' }, { label: 'Food Service' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Para o seu negócio</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Insumos confiáveis para cozinhas que não podem parar
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            O mercado de food service exige consistência: o mesmo sabor, a mesma textura, o mesmo rendimento em cada preparo. A MSM fornece insumos alimentícios com padrão industrial para operadores que dependem de qualidade previsível e abastecimento regular.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Seja para uma rede de restaurantes, uma cozinha central, um distribuidor especializado ou um atacado do setor, nossa estrutura foi desenhada para atender volumes B2B com agilidade e confiança.
          </p>
        </div>

        <div className="divider-gradient" />

        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">O que oferecemos</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Estrutura pensada para food service
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
              Tire suas dúvidas sobre Food Service
            </h2>
          </div>
          <Accordion items={SOLUTIONS_FAQ['food-service']} idPrefix="faq-food-service" />
        </div>

        <div className="divider-gradient" />

        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Vamos conversar sobre a sua operação?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Preencha o formulário de contato para food service e nossa equipe retornará com as melhores opções para o seu negócio.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Solicitar contato"
              context="Solução Food Service"
              fallbackPath="/contato#food_service"
            />
            <Link href="/produtos" className="btn-secondary text-[rgb(var(--text))]">
              Ver produtos
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
