import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { SOLUCOES } from '@/lib/constants/solucoes';

export const metadata: Metadata = {
  title: 'Soluções — Somatec Blocking',
  description:
    'Proteção contra surtos (Master Block), gestão da qualidade de energia, banco de capacitores, medição e laudos e manutenção de cabine primária para a indústria.',
  alternates: { canonical: '/solucoes' },
  openGraph: {
    title: 'Soluções — Somatec Blocking',
    description:
      'Produtos e serviços de eficiência e qualidade de energia para indústrias e empresas.',
    url: '/solucoes',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export const revalidate = 3600;

export default function SolucoesPage() {
  return (
    <>
      <PageHero
        title="Eficiência e qualidade de energia, de ponta a ponta"
        description="Do diagnóstico da rede à proteção contra surtos e à correção do fator de potência — soluções personalizadas para cada necessidade da sua planta."
        breadcrumbs={[{ label: 'Soluções' }]}
      />

      <section className="container-msm py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
          {SOLUCOES.map(({ slug, Icon, title, tagline, eyebrow }) => (
            <Link
              key={slug}
              href={`/solucoes/${slug}`}
              className="group flex flex-col gap-4 p-6 md:p-8 card-elevated transition-all duration-[250ms] ease-premium hover:-translate-y-0.5 hover:border-gold hover:shadow-premium-light"
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
                  {tagline}
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-gold">
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
            Não sabe por onde começar?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Comece pelo diagnóstico da sua rede — sem custo. A partir dele, a engenharia
            da Somatec indica a solução certa para a sua operação.
          </p>
          <CommercialCta
            label="Falar com a engenharia"
            fallbackPath="/contato"
            className="inline-flex"
            withArrow={false}
          />
        </div>
      </section>
    </>
  );
}
