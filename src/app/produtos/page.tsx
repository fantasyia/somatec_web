import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap,
  Activity,
  ShieldCheck,
  GaugeCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { CascadeDiagram } from '@/components/graphics/CascadeDiagram';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Reveal } from '@/components/ui/Reveal';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { JsonLd } from '@/components/seo/JsonLd';
import { masterBlockProductSchema } from '@/lib/seo/structured-data';
import { MASTER_BLOCK_MODELS, MB_TENSAO } from '@/lib/constants/masterblock';

export const metadata: Metadata = {
  title: 'MasterBlock — Linha de supressores (MB-01 a MB-12) | Somatec Blocking',
  description:
    'MasterBlock é o supressor de surtos e transientes com filtro passivo atuante em 100 kHz — não é um DPS comum. 12 modelos de 8 kA a 100 kA, DPS Classe III (ABNT NBR IEC 61643-1 / NBR 5410), para proteção em cascata na indústria.',
  alternates: { canonical: '/produtos' },
  openGraph: {
    title: 'MasterBlock — Linha de supressores (MB-01 a MB-12)',
    description:
      'Supressor de surtos e transientes com filtro passivo em 100 kHz. 12 modelos de 8 kA a 100 kA. DPS Classe III conforme ABNT NBR IEC 61643-1 e NBR 5410.',
    url: '/produtos',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export const revalidate = 3600;

// ── Funcionalidades (datasheet, p.4) ──────────────────────────────
const FEATURES = [
  {
    Icon: Activity,
    title: 'Filtro de harmônicos em 100 kHz',
    description:
      'Atenua os dV/dt gerados nas comutações das cargas — a frequência em que o dano realmente acontece.',
  },
  {
    Icon: Zap,
    title: 'Supressor de transientes',
    description:
      'Reduz a queima de equipamentos causada pelas comutações existentes na instalação elétrica.',
  },
  {
    Icon: ShieldCheck,
    title: 'DPS (supressor de surtos)',
    description:
      'Protege contra descargas atmosféricas acopladas às instalações elétricas.',
  },
  {
    Icon: GaugeCircle,
    title: 'Limitador de dV/dt acima de 50 V',
    description:
      'Atenua falhas internas de equipamentos ao suprimir os dV/dt na origem.',
  },
] as const;

// ── Especificações comuns a toda a linha (datasheet, p.5) ─────────
const COMMON_SPECS = [
  { label: 'Classificação', value: 'DPS Classe III' },
  { label: 'Normas aplicáveis', value: 'ABNT NBR IEC 61643-1 · ABNT NBR 5410' },
  { label: 'Aplicação', value: 'Rede trifásica 3F + N (3P)' },
  { label: 'Faixa de tensão', value: MB_TENSAO },
  { label: 'Tipo de corrente', value: 'Corrente alternada (CA) · 60 Hz' },
  { label: 'Sistema de aterramento', value: 'TN-S / TT' },
  { label: 'Temperatura de operação', value: '−40 °C a 60 °C' },
  { label: 'Grau de proteção', value: 'IP-65 (gabinete injetado sob alta pressão)' },
] as const;

export default function ProdutosPage() {
  return (
    <>
      <JsonLd data={masterBlockProductSchema()} />

      <PageHero
        eyebrow="Linha MasterBlock"
        title="Não é um DPS comum. É o supressor que atua em 100 kHz."
        description="O DPS de mercado atua abaixo de 10 kHz. O MasterBlock é um supressor e protetor contra surtos elétricos com filtro passivo e circuitos atuantes em 100 kHz — a frequência em que os transientes destroem seus equipamentos. Uma linha de 12 modelos, de 8 kA a 100 kA."
        breadcrumbs={[{ label: 'Produtos' }]}
      />

      {/* ── Funcionalidades ──────────────────────────────────────── */}
      <section className="container-msm py-12 md:py-16">
        <Reveal className="max-w-3xl space-y-4 mb-10">
          <span className="eyebrow">O que o MasterBlock faz</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Quatro funções em um único dispositivo
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Minimiza queima de equipamentos, paradas de processos em máquinas de alta
            criticidade e reduz custos de manutenção — aumentando a confiabilidade de
            processos produtivos automatizados.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ Icon, title, description }) => (
            <Reveal
              key={title}
              className="rounded-card border border-[rgb(var(--border))] p-6 bg-[rgb(var(--surface))] h-full"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-gold/10 text-gold mb-4">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="font-sans font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-[rgb(var(--text-muted))] leading-relaxed">
                {description}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Especificações comuns ────────────────────────────────── */}
      <section className="bg-[rgb(var(--surface))] border-y border-[rgb(var(--border))]">
        <div className="container-msm py-12 md:py-16">
          <Reveal className="max-w-3xl space-y-4 mb-8">
            <span className="eyebrow">Especificações da linha</span>
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Comuns a todos os modelos
            </h2>
          </Reveal>

          <Reveal>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgb(var(--border))] rounded-card overflow-hidden border border-[rgb(var(--border))]">
              {COMMON_SPECS.map((spec) => (
                <div key={spec.label} className="bg-[rgb(var(--bg))] p-5">
                  <dt className="text-xs font-sans font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
                    {spec.label}
                  </dt>
                  <dd className="mt-1.5 font-sans font-semibold text-sm text-[rgb(var(--text))]">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── Tabela de modelos MB-01 a MB-12 ──────────────────────── */}
      <section className="container-msm py-12 md:py-16">
        <Reveal className="max-w-3xl space-y-4 mb-8">
          <span className="eyebrow">
            <Layers className="inline h-3.5 w-3.5 mr-1 -mt-0.5" aria-hidden="true" />
            Modelos
          </span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Do pequeno comércio à indústria pesada
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            O modelo é selecionado pela corrente de carga do circuito (A) — toda a linha
            opera de 110&nbsp;V a 1100&nbsp;V. Cada aplicação também exige uma capacidade de
            escoamento de surto. Fale com a engenharia para o dimensionamento do seu
            projeto de proteção em cascata.
          </p>
        </Reveal>

        <Reveal className="overflow-x-auto rounded-card border border-[rgb(var(--border))]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-deep_navy text-white text-left">
                <th scope="col" className="px-4 py-3 font-sans font-semibold">Modelo</th>
                <th scope="col" className="px-4 py-3 font-sans font-semibold">
                  Corrente de carga <span className="text-white/60 font-normal">(A)</span>
                </th>
                <th scope="col" className="px-4 py-3 font-sans font-semibold">
                  Máx. corrente de surto <span className="text-white/60 font-normal">(8/20 µs)</span>
                </th>
                <th scope="col" className="px-4 py-3 font-sans font-semibold">
                  Corrente nominal <span className="text-white/60 font-normal">(In)</span>
                </th>
                <th scope="col" className="px-4 py-3 font-sans font-semibold">
                  Dimensões <span className="text-white/60 font-normal">(C×L×A mm)</span>
                </th>
                <th scope="col" className="px-4 py-3 font-sans font-semibold">Peso (kg)</th>
              </tr>
            </thead>
            <tbody>
              {MASTER_BLOCK_MODELS.map((m, i) => (
                <tr
                  key={m.model}
                  className={i % 2 === 0 ? 'bg-[rgb(var(--bg))]' : 'bg-[rgb(var(--surface))]'}
                >
                  <th scope="row" className="px-4 py-3 font-sans font-bold text-gold whitespace-nowrap">
                    {m.model}
                  </th>
                  <td className="px-4 py-3 font-semibold text-[rgb(var(--text))] whitespace-nowrap">{m.loadLabel}</td>
                  <td className="px-4 py-3 font-semibold text-[rgb(var(--text))]">{m.surge}</td>
                  <td className="px-4 py-3 text-[rgb(var(--text-muted))]">{m.nominal}</td>
                  <td className="px-4 py-3 text-[rgb(var(--text-muted))] whitespace-nowrap">{m.dim}</td>
                  <td className="px-4 py-3 text-[rgb(var(--text-muted))]">{m.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <p className="mt-4 text-xs text-[rgb(var(--text-muted))]">
          Fabricante: Somatecblocking UF Eletroeletrônicos LTDA · CNPJ 16.774.052/0001-55.
          Corrente de carga conforme a Tabela de Potências Master Block 2026; demais valores
          conforme a folha de dados. Especificações sujeitas a revisão técnica.
        </p>
      </section>

      {/* ── Proteção em cascata ──────────────────────────────────── */}
      <section className="bg-deep_navy text-white">
        <div className="container-msm py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal className="space-y-5">
              <span className="eyebrow">Como se protege de verdade</span>
              <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
                Proteção em cascata + aterramento dedicado
              </h2>
              <p className="text-white/80 leading-relaxed">
                Um único supressor junto ao equipamento sensível não basta — ele fica
                sujeito a um surto acima da sua capacidade de escoamento. A Somatec
                projeta a proteção em cascata: um MasterBlock na entrada da instalação,
                outro no quadro de distribuição e outro próximo ao equipamento crítico,
                atenuando o surto gradativamente.
              </p>
              <p className="text-white/80 leading-relaxed">
                E porque o desempenho depende do referencial de terra, instalamos um
                sistema de aterramento próprio e exclusivo, com equipotencialização
                conforme o capítulo de aterramento da NBR 5410.
              </p>
            </Reveal>

            <Reveal>
              <CascadeDiagram />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="container-msm py-14 md:py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <span className="eyebrow">Diagnóstico de risco</span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Qual MasterBlock a sua planta precisa?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Descubra o modelo pela corrente do seu circuito, ou calcule quanto as paradas e queimas
            custam por ano na sua operação — cada um em 2 minutos. Ou fale direto com a engenharia da
            Somatec para um projeto de mitigação de surtos e transientes sob medida.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/ferramentas/qual-master-block" className="btn-primary group">
              Descobrir meu modelo
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
            <Link
              href="/ferramentas/custo-de-parada"
              className="inline-flex items-center rounded-btn border border-[rgb(var(--border))] px-5 py-2.5 font-sans text-sm font-medium text-[rgb(var(--text))] transition-colors hover:border-gold hover:text-gold"
            >
              Calcular meu prejuízo
            </Link>
            <CommercialCta
              label="Falar com a engenharia"
              context="Linha MasterBlock (MB-01 a MB-12)"
              fallbackPath="/contato"
              variant="secondary"
              className="inline-flex"
            />
          </div>
        </div>
      </section>
    </>
  );
}
