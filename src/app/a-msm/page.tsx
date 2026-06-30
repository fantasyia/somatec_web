import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Building2, FlaskConical, ShieldCheck, Users } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = {
  title: 'A MSM — Indústria alimentícia B2B',
  robots: { index: true, follow: true },
};

const sections = [
  {
    href: '/a-msm/quem-somos',
    icon: Users,
    eyebrow: 'Institucional',
    title: 'Quem somos',
    description:
      'Conheça a história, o propósito e os valores que orientam a atuação da MSM como parceira estratégica da indústria alimentícia.',
  },
  {
    href: '/a-msm/estrutura-industrial',
    icon: Building2,
    eyebrow: 'Capacidade',
    title: 'Estrutura industrial',
    description:
      'Infraestrutura produtiva dimensionada para atender volumes B2B com consistência, flexibilidade e rastreabilidade de ponta a ponta.',
  },
  {
    href: '/a-msm/qualidade-e-seguranca',
    icon: ShieldCheck,
    eyebrow: 'Conformidade',
    title: 'Qualidade e segurança',
    description:
      'Processos de controle de qualidade e segurança alimentar implementados em cada etapa da cadeia produtiva.',
  },
  {
    href: '/solucoes',
    icon: FlaskConical,
    eyebrow: 'Comercial',
    title: 'Nossas soluções',
    description:
      'Food service, B2B, terceirização, envase, marcas próprias e distribuição — descubra como a MSM pode atender o seu negócio.',
  },
];

export default function AMsmPage() {
  return (
    <>
      <PageHero
        eyebrow="A MSM"
        title="Indústria, qualidade e parceria"
        description="A MSM é uma indústria alimentícia voltada ao mercado B2B, com atuação integrada em produção, envase, marcas próprias e soluções comerciais para todo o Brasil."
        breadcrumbs={[{ label: 'A MSM' }]}
      />

      <section className="container-msm py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
          {sections.map(({ href, icon: Icon, eyebrow, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-4 p-8 md:p-10 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-all duration-[250ms] ease-premium hover:-translate-y-0.5 hover:border-gold hover:shadow-premium-light dark:hover:shadow-premium-dark"
            >
              <Icon
                className="h-8 w-8 text-[rgb(var(--text))] group-hover:text-gold transition-colors duration-[250ms]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="space-y-1.5">
                <span className="eyebrow text-[11px]">{eyebrow}</span>
                <h2 className="font-serif text-h3-m font-semibold text-[rgb(var(--text))]">
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
      </section>
    </>
  );
}
