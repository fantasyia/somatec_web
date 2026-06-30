import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ChefHat, Building2, Factory, Package, Tag, Truck } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';

export const metadata: Metadata = {
  title: 'Soluções B2B — MSM Indústria',
  description:
    'Soluções B2B integradas da MSM Indústria — food service, terceirização de produção, envase, marcas próprias e distribuição para a indústria alimentícia.',
  alternates: { canonical: '/solucoes' },
  openGraph: {
    title: 'Soluções B2B — MSM Indústria',
    description:
      'Soluções B2B integradas da MSM Indústria — food service, terceirização de produção, envase, marcas próprias e distribuição para a indústria alimentícia.',
    url: '/solucoes',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

const solutions = [
  {
    href: '/solucoes/food-service',
    icon: ChefHat,
    title: 'Food Service',
    description: 'Produtos e embalagens pensados para o universo de restaurantes, redes, cozinhas industriais e operadores de food service em escala.',
  },
  {
    href: '/solucoes/b2b',
    icon: Building2,
    title: 'B2B',
    description: 'Fornecimento direto para indústrias, redes atacadistas e distribuidores com volumes adequados, regularidade e suporte técnico.',
  },
  {
    href: '/solucoes/terceirizacao-de-producao',
    icon: Factory,
    title: 'Terceirização de Produção',
    description: 'Estrutura industrial completa para produzir sua marca com controle de processo, qualidade garantida e flexibilidade de formulação.',
  },
  {
    href: '/solucoes/envase',
    icon: Package,
    title: 'Envase',
    description: 'Serviços de envase em diferentes formatos e capacidades, com controle rigoroso de pesagem, vedação e rotulagem.',
  },
  {
    href: '/solucoes/marcas-proprias',
    icon: Tag,
    title: 'Marcas Próprias',
    description: 'Desenvolvimento e produção de marcas exclusivas para redes, distribuidores e varejistas que buscam identidade própria com qualidade industrial.',
  },
  {
    href: '/solucoes/distribuicao',
    icon: Truck,
    title: 'Distribuição',
    description: 'Logística estruturada para levar os produtos MSM a pontos de venda, distribuidores e parceiros em todo o território nacional.',
  },
];

export default function SolucoesPage() {
  return (
    <>
      <PageHero
        eyebrow="Soluções"
        title="Soluções completas para o seu negócio"
        description="Atuação integrada em toda a cadeia alimentícia — da produção à entrega — com soluções adaptadas para cada perfil de parceiro B2B."
        breadcrumbs={[{ label: 'Soluções' }]}
      />

      <section className="container-msm py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
          {solutions.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-4 p-6 md:p-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-all duration-[250ms] ease-premium hover:-translate-y-0.5 hover:border-gold hover:shadow-premium-light"
            >
              <Icon
                className="h-8 w-8 text-[rgb(var(--text))] group-hover:text-gold transition-colors duration-[250ms]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="space-y-2">
                <h2 className="font-sans font-semibold text-lg md:text-xl text-[rgb(var(--text))]">
                  {title}
                </h2>
                <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                  {description}
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-sans font-semibold text-gold">
                Saiba mais
                <ChevronRight
                  className="h-3.5 w-3.5 transition-transform duration-200 ease-premium group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 md:mt-16 divider-gradient" />

        <div className="mt-10 md:mt-12 max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Não encontrou o que procura?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Nossa equipe comercial está disponível para entender sua demanda e apresentar a melhor forma de atendê-la.
          </p>
          <CommercialCta
            label="Falar com a equipe"
            fallbackPath="/contato"
            className="inline-flex"
            withArrow={false}
          />
        </div>
      </section>
    </>
  );
}
