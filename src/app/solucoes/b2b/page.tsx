import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import Link from 'next/link';
import { Building2, ShieldCheck, FileText, Handshake } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Accordion } from '@/components/ui/Accordion';
import { SOLUTIONS_FAQ } from '@/content/solutionsFaq';

export const metadata: Metadata = {
  title: 'B2B',
  description:
    'Fornecimento industrial B2B para indústrias, redes atacadistas e distribuidores. Escala, qualidade rastreável e relacionamento comercial direto com a MSM.',
  alternates: { canonical: '/solucoes/b2b' },
  openGraph: {
    title: 'B2B | MSM Alimentos',
    description:
      'Fornecimento industrial B2B para indústrias, redes atacadistas e distribuidores. Escala, qualidade rastreável e relacionamento comercial direto.',
    url: '/solucoes/b2b',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: true, follow: true },
};

const benefits = [
  { icon: Building2, title: 'Escala para grandes volumes', description: 'Capacidade produtiva preparada para atender pedidos de alto volume com consistência de lote e prazo de entrega previsível.' },
  { icon: ShieldCheck, title: 'Qualidade rastreável', description: 'Laudos, fichas técnicas e documentação disponíveis para atender as exigências de compra de grandes redes e indústrias.' },
  { icon: FileText, title: 'Catálogo técnico', description: 'Portfólio com especificações detalhadas de cada produto — composição, embalagem, validade, shelf life e condições de armazenamento.' },
  { icon: Handshake, title: 'Relacionamento comercial direto', description: 'Atendimento por equipe comercial especializada, com flexibilidade para negociar condições, prazos e formatos de fornecimento.' },
];

export default function B2bPage() {
  return (
    <>
      <PageHero
        eyebrow="Solução"
        title="Fornecimento B2B"
        description="Produtos alimentícios com qualidade industrial fornecidos diretamente para indústrias, redes atacadistas, distribuidores e operadores de grande porte."
        breadcrumbs={[{ label: 'Soluções', href: '/solucoes' }, { label: 'B2B' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-20 md:space-y-28">

        <div className="max-w-3xl mx-auto space-y-6">
          <span className="eyebrow">Para compradores industriais</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Fornecimento industrial com previsibilidade e confiança
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Compradores B2B precisam de muito mais do que bons produtos — precisam de fornecedores confiáveis, documentação adequada, capacidade de escala e um parceiro que entenda as dinâmicas de abastecimento industrial.
          </p>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            A MSM opera com processos padronizados e equipe comercial dedicada para atender distribuidores, redes de varejo, indústrias de alimentos e outros compradores B2B que demandam qualidade consistente e relacionamento de longo prazo.
          </p>
        </div>

        <div className="divider-gradient" />

        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Por que escolher a MSM</span>
            <h2 className="mt-3 font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Diferenciais para o comprador industrial
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
              Tire suas dúvidas sobre o fornecimento B2B
            </h2>
          </div>
          <Accordion items={SOLUTIONS_FAQ['b2b']} idPrefix="faq-b2b" />
        </div>

        <div className="divider-gradient" />

        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Inicie uma negociação
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Preencha o formulário B2B e nossa equipe comercial entrará em contato para apresentar o portfólio e discutir condições de fornecimento.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <CommercialCta
              label="Solicitar proposta B2B"
              context="Solução B2B"
              fallbackPath="/contato#b2b"
            />
            <Link href="/produtos" className="btn-secondary text-[rgb(var(--text))]">
              Explorar catálogo
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
