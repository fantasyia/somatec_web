import type { Metadata } from 'next';
import { Building2, Gauge, Cpu, FileCheck2 } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Reveal } from '@/components/ui/Reveal';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';

export const metadata: Metadata = {
  title: 'Calculadora de orçamento — Somatec Blocking',
  description:
    'Dimensione o Master Block ideal para o seu comércio ou residência de alto padrão e receba o orçamento na hora.',
  alternates: { canonical: '/ferramentas/orcamento' },
  openGraph: {
    title: 'Calculadora de orçamento Master Block',
    description: 'Responda poucas perguntas e receba modelo, quantidade e preço.',
    url: '/ferramentas/orcamento',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

// ============================================================================
// PLACEHOLDER — a calculadora real depende da tabela de modelos/SKUs, regras
// de dimensionamento e pricing (a definir com o Leandro). Esta página fixa o
// fluxo em 4 passos e a navegação; a lógica entra quando a spec chegar.
// Spec: leo-Skills-master/clients/somatec/reports/site/ferramentas-interativas-spec.md §1
// ============================================================================

const STEPS = [
  {
    Icon: Building2,
    title: 'Seu estabelecimento',
    description: 'Comércio, residência de alto padrão ou pequena operação.',
  },
  {
    Icon: Gauge,
    title: 'Porte da instalação',
    description: 'Entrada de energia, número de quadros e carga instalada.',
  },
  {
    Icon: Cpu,
    title: 'O que proteger',
    description: 'Eletrônicos, automação, refrigeração e equipamentos sensíveis.',
  },
  {
    Icon: FileCheck2,
    title: 'Seu orçamento',
    description: 'Modelo Master Block recomendado, quantidade, preço e pedido online.',
  },
] as const;

export default function OrcamentoPage() {
  return (
    <>
      <PageHero
        title="Seu orçamento Master Block em minutos"
        description="Sem reunião e sem espera: informe o perfil do seu estabelecimento e receba o equipamento certo, com preço e pedido online."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Calculadora de orçamento' },
        ]}
      />

      <section className="container-msm py-16 md:py-20" aria-label="Como funciona a calculadora">
        <Reveal className="mb-10">
          <span className="placeholder-tag">Em breve — em desenvolvimento</span>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-4">
          {STEPS.map(({ Icon, title, description }, i) => (
            <Reveal
              key={title}
              delay={i * 80}
              className="relative rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-btn bg-cyan/10 text-cyan">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="mt-4 text-[11px] font-sans font-bold uppercase tracking-widest text-cyan">
                Passo {i + 1}
              </div>
              <h2 className="mt-1 font-sans text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">{description}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 text-center md:p-12">
          <h2 className="font-serif text-h3-m md:text-h3-d font-semibold">
            Enquanto a calculadora não fica pronta, a engenharia dimensiona pra você
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[rgb(var(--text-muted))]">
            Fale com a equipe pelo WhatsApp com os dados do seu estabelecimento e receba a
            recomendação de modelo e o orçamento do mesmo jeito — sem custo.
          </p>
          <div className="mt-6 flex justify-center">
            <CommercialCta label="Pedir meu orçamento" context="Calculadora de orçamento (site)" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
