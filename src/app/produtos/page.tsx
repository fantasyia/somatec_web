import type { Metadata } from 'next';
import {
  Zap,
  Activity,
  ShieldCheck,
  GaugeCircle,
  Layers,
  Gauge,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Reveal } from '@/components/ui/Reveal';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { JsonLd } from '@/components/seo/JsonLd';
import { masterBlockProductSchema } from '@/lib/seo/structured-data';

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
  { label: 'Tensões nominais (Un)', value: '220 / 380 / 440 / 575 / 690 V AC' },
  { label: 'Tipo de corrente', value: 'Corrente alternada (CA) · 60 Hz' },
  { label: 'Sistema de aterramento', value: 'TN-S / TT' },
  { label: 'Temperatura de operação', value: '−40 °C a 60 °C' },
  { label: 'Grau de proteção', value: 'IP-65 (gabinete injetado sob alta pressão)' },
] as const;

// ── Modelos MB-01 a MB-12 (datasheet, p.5 e p.14) ─────────────────
type ModelRow = {
  model: string;
  surge: string; // Máxima corrente de surto 8/20 µs (= Imax)
  nominal: string; // In — corrente nominal de descarga
  dim: string; // C x L x A (mm)
  weight: string; // kg
};

const MODELS: readonly ModelRow[] = [
  { model: 'MB-01', surge: '8 kA', nominal: '3 kA', dim: '150 × 100 × 60', weight: '1,4' },
  { model: 'MB-02', surge: '16 kA', nominal: '6 kA', dim: '150 × 100 × 60', weight: '1,6' },
  { model: 'MB-03', surge: '24 kA', nominal: '9 kA', dim: '200 × 100 × 70', weight: '1,8' },
  { model: 'MB-04', surge: '32 kA', nominal: '12 kA', dim: '200 × 100 × 70', weight: '2,0' },
  { model: 'MB-05', surge: '40 kA', nominal: '15 kA', dim: '200 × 150 × 90', weight: '3,4' },
  { model: 'MB-06', surge: '48 kA', nominal: '18 kA', dim: '200 × 150 × 90', weight: '3,7' },
  { model: 'MB-07', surge: '56 kA', nominal: '21 kA', dim: '250 × 200 × 100', weight: '5,2' },
  { model: 'MB-08', surge: '64 kA', nominal: '24 kA', dim: '250 × 200 × 100', weight: '5,5' },
  { model: 'MB-09', surge: '72 kA', nominal: '27 kA', dim: '280 × 220 × 100', weight: '8,2' },
  { model: 'MB-10', surge: '80 kA', nominal: '30 kA', dim: '280 × 220 × 100', weight: '8,5' },
  { model: 'MB-11', surge: '88 kA', nominal: '33 kA', dim: '350 × 260 × 120', weight: '13,5' },
  { model: 'MB-12', surge: '100 kA', nominal: '37 kA', dim: '350 × 260 × 120', weight: '14,0' },
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
            Cada aplicação exige uma capacidade de escoamento. Selecione o modelo pela
            máxima corrente de surto (8/20&nbsp;µs) — ou fale com a engenharia para o
            dimensionamento do seu projeto de proteção em cascata.
          </p>
        </Reveal>

        <Reveal className="overflow-x-auto rounded-card border border-[rgb(var(--border))]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-deep_navy text-white text-left">
                <th scope="col" className="px-4 py-3 font-sans font-semibold">Modelo</th>
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
              {MODELS.map((m, i) => (
                <tr
                  key={m.model}
                  className={i % 2 === 0 ? 'bg-[rgb(var(--bg))]' : 'bg-[rgb(var(--surface))]'}
                >
                  <th scope="row" className="px-4 py-3 font-sans font-bold text-gold whitespace-nowrap">
                    {m.model}
                  </th>
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
          Valores conforme a folha de dados MasterBlock. Especificações sujeitas a
          revisão técnica.
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

            <Reveal className="space-y-4">
              {[
                { Icon: Layers, t: 'Entrada da instalação', d: 'Primeiro estágio: absorve os maiores surtos vindos da rede.' },
                { Icon: Gauge, t: 'Quadro de distribuição', d: 'Segundo estágio: atenua o residual antes das cargas.' },
                { Icon: ShieldCheck, t: 'Junto ao equipamento sensível', d: 'Proteção fina, agora dentro da capacidade de escoamento.' },
              ].map(({ Icon, t, d }) => (
                <div
                  key={t}
                  className="flex gap-4 rounded-card border border-white/10 bg-white/[0.03] p-5"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-gold/15 text-gold">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-sans font-semibold text-base">{t}</h3>
                    <p className="text-sm text-white/70 leading-relaxed mt-1">{d}</p>
                  </div>
                </div>
              ))}
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
            O dimensionamento correto depende da carga, da criticidade e da topologia da
            sua instalação. Fale com a engenharia da Somatec e receba um projeto de
            mitigação de surtos e transientes sob medida.
          </p>
          <CommercialCta
            label="Solicitar diagnóstico"
            context="Linha MasterBlock (MB-01 a MB-12)"
            fallbackPath="/contato"
            className="inline-flex mt-2"
          />
        </div>
      </section>
    </>
  );
}
