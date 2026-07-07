import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ClipboardCheck, LineChart, Leaf } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';

export const metadata: Metadata = {
  title: 'Comprovação, normas e segurança — Somatec Blocking',
  description:
    'Proteção comprovada por medição antes e depois, dentro das normas ABNT NBR 5410 e IEC 61643-1, alinhada à ISO 50001. 26 anos de atuação, sem nenhum acidente.',
  alternates: { canonical: '/a-somatec/comprovacao-e-normas' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

const pillars = [
  {
    icon: LineChart,
    title: 'Comprovação por medição',
    description:
      'Medimos a rede antes e depois da instalação, com analisadores de qualidade de energia. O resultado é constatado na prática — como os 92% de supressão de VTCD medidos no case Cinpal.',
  },
  {
    icon: ClipboardCheck,
    title: 'Dentro das normas',
    description:
      'O Master Block é DPS Classe III conforme a ABNT NBR 5410 e a IEC 61643-1, com aterramento e equipotencialização projetados segundo a norma.',
  },
  {
    icon: Leaf,
    title: 'Eficiência energética (ISO 50001)',
    description:
      'Nossa atuação em qualidade de energia caminha alinhada à certificação ISO 50001, reduzindo desperdícios, retrabalhos e geração de lixo eletrônico.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança total na instalação',
    description:
      'Em 26 anos de atuação, nenhum acidente registrado. As instalações são feitas com a rede desligada, e os produtos atuam de forma passiva, em paralelo ao circuito.',
  },
];

export default function ComprovacaoNormasPage() {
  return (
    <>
      <PageHero
        eyebrow="A Somatec Blocking"
        title="Comprovação, normas e segurança"
        description="Somos técnicos e científicos: comprovamos a eficácia por laudos e medições, atuamos dentro das normas e mantemos um histórico de zero acidentes."
        breadcrumbs={[{ label: 'A Somatec', href: '/a-somatec' }, { label: 'Comprovação e normas' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        {/* Intro */}
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Nossa abordagem</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Prova antes da palavra
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            A Somatec Blocking não pede um voto de confiança: a eficácia da solução é constatada na
            própria planta do cliente, com medições de qualidade de energia antes e depois da
            instalação. É por isso que o nosso modelo comercial permite pagar apenas quando o
            resultado é aprovado.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Toda a atuação respeita as normas técnicas e de segurança — do dimensionamento do DPS
            Classe III ao aterramento conforme a NBR 5410 — e as instalações seguem os procedimentos
            de segurança que nos permitiram chegar a 26 anos sem nenhum acidente.
          </p>
        </div>

        <div className="divider-gradient" />

        {/* Pillars */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">O que nos sustenta</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Comprovação, conformidade e segurança
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {pillars.map(({ icon: Icon, title, description }) => (
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
            Quer ver a prova na sua planta?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Solicite um diagnóstico de qualidade de energia, sem custo, e veja a medição antes e depois.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Solicitar diagnóstico"
              context="Comprovação, normas e segurança"
              fallbackPath="/contato"
            />
            <Link href="/faq" className="btn-secondary text-[rgb(var(--text))]">
              Ver perguntas frequentes
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
