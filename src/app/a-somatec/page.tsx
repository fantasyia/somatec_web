import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Cpu, Award, ShieldCheck, Users } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';

export const metadata: Metadata = {
  title: 'A Somatec Blocking — Autoridade em qualidade de energia',
  description:
    'A Somatec Blocking é uma empresa nacional de eficiência energética e qualidade de energia, fundada em 1999. Criamos o Master Block e projetos de proteção elétrica para a indústria.',
  alternates: { canonical: '/a-somatec' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

const sections = [
  {
    href: '/a-somatec/quem-somos',
    icon: Users,
    eyebrow: 'Institucional',
    title: 'Quem somos',
    description:
      'Nossa história desde 1999, o propósito e os valores que fazem da Somatec Blocking autoridade em eficiência e qualidade de energia.',
  },
  {
    href: '/produtos',
    icon: Cpu,
    eyebrow: 'Tecnologia',
    title: 'Sistema Master Block IoT',
    description:
      'O filtro híbrido que atua em 100 kHz, o software de gestão on-line de qualidade de energia e as inspeções periódicas — proteção que se comprova em dados.',
  },
  {
    href: '/a-somatec/comprovacao-e-normas',
    icon: Award,
    eyebrow: 'Resultados',
    title: 'Comprovação e garantia',
    description:
      'Laudos, medições e um modelo de investimento sem risco: o cliente só investe quando o resultado é comprovado na própria planta.',
  },
  {
    href: '/solucoes',
    icon: ShieldCheck,
    eyebrow: 'Portfólio',
    title: 'Produtos e serviços',
    description:
      'Sistema Master Block — supressor com software de gestão de energia on-line — e Banco de Capacitores, além de medições, laudos e manutenção de cabine primária.',
  },
];

export default function ASomatecPage() {
  return (
    <>
      <PageHero
        title="Autoridade em qualidade de energia desde 1999"
        description="Somos uma empresa nacional de eficiência energética. Desenvolvemos produtos e projetos que melhoram a qualidade da energia elétrica de indústrias e empresas — protegendo ativos, evitando paradas e reduzindo custos."
        breadcrumbs={[{ label: 'A Somatec' }]}
      />

      <section className="container-msm py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
          {sections.map(({ href, icon: Icon, eyebrow, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-4 p-8 md:p-10 card-elevated transition-all duration-[250ms] ease-premium hover:-translate-y-0.5 hover:border-gold hover:shadow-premium-light dark:hover:shadow-premium-dark"
            >
              <Icon
                className="h-8 w-8 text-[rgb(var(--text))] group-hover:text-gold transition-colors duration-[250ms]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="space-y-1.5">
                <h2 className="font-serif text-h3-m font-semibold text-[rgb(var(--text))]">
                  {title}
                </h2>
                <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                  {description}
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
      </section>
    </>
  );
}
