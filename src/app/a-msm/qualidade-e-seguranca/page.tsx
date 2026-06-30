import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ClipboardCheck, Microscope, AlertTriangle } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';

export const metadata: Metadata = {
  title: 'Qualidade e segurança — A MSM',
  robots: { index: true, follow: true },
};

const pillars = [
  {
    icon: ClipboardCheck,
    title: 'Controle de entrada',
    description:
      'Análise e aprovação de matérias-primas e embalagens antes de qualquer uso na produção, com critérios técnicos definidos por categoria.',
  },
  {
    icon: Microscope,
    title: 'Análises laboratoriais',
    description:
      'Monitoramento microbiológico e físico-químico ao longo do processo produtivo, garantindo conformidade do produto em cada lote.',
  },
  {
    icon: AlertTriangle,
    title: 'Controle de pontos críticos',
    description:
      'Identificação e monitoramento dos pontos críticos de controle ao longo da linha de produção, com registros e planos de ação documentados.',
  },
  {
    icon: ShieldCheck,
    title: 'Auditoria e rastreabilidade',
    description:
      'Processos de auditoria interna periódica e rastreabilidade completa que permite identificar origem e destino de cada lote produzido.',
  },
];

export default function QualidadeSegurancaPage() {
  return (
    <>
      <PageHero
        eyebrow="A MSM"
        title="Qualidade e segurança alimentar"
        description="Processos estruturados de controle de qualidade e segurança alimentar aplicados em todas as etapas da produção, do recebimento de insumos à entrega do produto final."
        breadcrumbs={[{ label: 'A MSM', href: '/a-msm' }, { label: 'Qualidade e segurança' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        {/* Intro */}
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Nossa abordagem</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Segurança alimentar como prioridade estrutural
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            A MSM trata a segurança alimentar como fundamento inegociável de toda a operação. Isso significa que os controles de qualidade não são uma etapa isolada, mas um conjunto de práticas integradas ao fluxo produtivo — do recebimento de insumos até a expedição dos produtos acabados.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Essa cultura de qualidade garante que clientes B2B recebam produtos com consistência, conformidade e rastreabilidade, atendendo às exigências técnicas e regulatórias do mercado alimentício brasileiro.
          </p>
        </div>

        <div className="divider-gradient" />

        {/* Pillars */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Pilares do sistema</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Como garantimos a qualidade
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
            Documentação técnica disponível
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Solicite à nossa equipe comercial informações técnicas, laudos e documentação de qualidade referentes aos produtos de seu interesse.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Solicitar informações"
              context="Qualidade e segurança — documentos técnicos"
              fallbackPath="/contato#b2b"
            />
          </div>
        </div>

      </section>
    </>
  );
}
