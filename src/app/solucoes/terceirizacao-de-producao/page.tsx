import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import Link from 'next/link';
import { Factory, Settings, FileText, ShieldCheck } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Accordion } from '@/components/ui/Accordion';
import { SOLUTIONS_FAQ } from '@/content/solutionsFaq';

export const metadata: Metadata = {
  title: 'Terceirização de produção',
  description:
    'Produza sua marca com a infraestrutura industrial da MSM — da análise da formulação à entrega. Flexibilidade, controle de qualidade e documentação completa.',
  alternates: { canonical: '/solucoes/terceirizacao-de-producao' },
  openGraph: {
    title: 'Terceirização de produção | MSM Alimentos',
    description:
      'Produza sua marca com a infraestrutura industrial da MSM — da formulação à entrega. Flexibilidade, qualidade e documentação completa.',
    url: '/solucoes/terceirizacao-de-producao',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

const steps = [
  { label: '01', title: 'Análise da formulação', description: 'Avaliação técnica da receita ou especificação do produto, identificando requisitos de processo, ingredientes e embalagem.' },
  { label: '02', title: 'Desenvolvimento e testes', description: 'Produção de lotes-piloto para validação de sabor, textura, rendimento e conformidade com as especificações do cliente.' },
  { label: '03', title: 'Aprovação e escalonamento', description: 'Ajustes finais após aprovação e planejamento da produção em escala, com definição de prazos, volumes e cadência de entrega.' },
  { label: '04', title: 'Produção e entrega', description: 'Execução da produção industrial com controle de qualidade, rastreabilidade e documentação completa por lote.' },
];

const benefits = [
  { icon: Factory, title: 'Estrutura pronta', description: 'Planta industrial já certificada, com equipamentos e processos validados — sem necessidade de investimento próprio em infraestrutura.' },
  { icon: Settings, title: 'Flexibilidade de formulação', description: 'Capacidade de adaptar receitas e processos para atender especificações técnicas e sensoriais de diferentes marcas.' },
  { icon: FileText, title: 'Documentação completa', description: 'Fichas técnicas, laudos e registros de produção disponíveis para cada lote, facilitando auditorias e requisitos de compra.' },
  { icon: ShieldCheck, title: 'Controle de qualidade incluso', description: 'Todo o processo de terceirização inclui os mesmos controles de qualidade aplicados aos produtos próprios da MSM.' },
];

export default function TerceirizacaoPage() {
  return (
    <>
      <PageHero
        eyebrow="Solução"
        title="Terceirização de Produção"
        description="Produza sua marca com a estrutura industrial da MSM — da formulação ao produto acabado, com qualidade, rastreabilidade e documentação completa."
        breadcrumbs={[{ label: 'Soluções', href: '/solucoes' }, { label: 'Terceirização de Produção' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Como funciona</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Sua marca produzida com infraestrutura industrial
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Muitas empresas têm excelentes marcas mas não têm estrutura industrial própria — ou não querem imobilizar capital em equipamentos e processos. A terceirização de produção com a MSM é a alternativa para ter produtos de qualidade industrial sem os custos e a complexidade de operar uma fábrica.
          </p>
        </div>

        {/* Process steps */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Processo</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Do briefing ao produto final
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {steps.map(({ label, title, description }) => (
              <div key={label} className="p-8 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                <span className="font-serif text-[2.5rem] leading-none font-semibold text-gold/30 select-none">{label}</span>
                <h3 className="mt-3 font-sans font-semibold text-xl md:text-[1.375rem] text-[rgb(var(--text))]">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[rgb(var(--text-muted))]">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="divider-gradient" />

        {/* Benefits */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Diferenciais</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Por que terceirizar com a MSM
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
              Tire suas dúvidas sobre Terceirização
            </h2>
          </div>
          <Accordion items={SOLUTIONS_FAQ['terceirizacao-de-producao']} idPrefix="faq-terceirizacao" />
        </div>

        <div className="divider-gradient" />

        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Pronto para discutir seu projeto?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Preencha o formulário de terceirização e nossa equipe técnica e comercial entrará em contato.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Solicitar avaliação"
              context="Solução Terceirização de Produção"
              fallbackPath="/contato#terceirizacao"
            />
          </div>
        </div>

      </section>
    </>
  );
}
