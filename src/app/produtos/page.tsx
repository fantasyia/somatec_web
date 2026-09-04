import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap,
  Activity,
  ShieldCheck,
  GaugeCircle,
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
        title="Não é um DPS comum. É o supressor que atua em 100 kHz."
        description="O DPS de mercado atua abaixo de 10 kHz. O MasterBlock é um supressor e protetor contra surtos elétricos com filtro passivo e circuitos atuantes em 100 kHz — a frequência em que os transientes destroem seus equipamentos. Uma linha de 12 modelos, de 8 kA a 100 kA."
        breadcrumbs={[{ label: 'Produtos' }]}
      />

      {/* ── Funcionalidades ──────────────────────────────────────── */}
      <section className="container-msm py-12 md:py-16">
        <Reveal className="max-w-3xl space-y-4 mb-10">
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
      <section className="border-y border-[rgb(var(--border))]">
        <div className="container-msm py-12 md:py-16">
          <Reveal className="max-w-3xl space-y-4 mb-8">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Comuns a todos os modelos
            </h2>
          </Reveal>

          <Reveal>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgb(var(--border))] rounded-card overflow-hidden border border-[rgb(var(--border))]">
              {COMMON_SPECS.map((spec) => (
                <div key={spec.label} className="bg-[rgb(var(--bg))] p-5">
                  <dt className="text-xs font-sans font-semibold text-[rgb(var(--text-muted))]">
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

      {/* ── Master Block IoT — a gestão de energia ────────────────────
          Veio de `/solucoes/qualidade-de-energia`, removida em 04/09 junto com
          a seção inteira: o site passou a ser só Master Block, e o
          monitoramento nunca foi produto à parte — é o que o Sistema Master
          Block entrega depois de instalado.

          🔒 Continua valendo: NUNCA oferecer o software/monitoramento como
          produto separado, teste ou demo. Aqui ele é seção do produto.

          ⚠️ PROVISÓRIO: o Léo avisou (04/09) que vem repaginação trazendo o
          Master Block IoT como produto PRINCIPAL, com os relatórios mensais
          de gestão. Esta seção existe pra o conteúdo não se perder no meio do
          caminho — não é o desenho final, e não vale investir nela. Os
          relatórios mensais NÃO estão escritos aqui de propósito: não há copy
          aprovada ainda. */}
      <div className="tone-surface">
        <section className="container-msm py-12 md:py-16" aria-label="Master Block IoT">
          <Reveal className="max-w-3xl space-y-4">
            <span className="inline-block rounded-btn border border-cyan/40 px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-cyan">
              Sistema IoT
            </span>
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Não para na instalação: o sistema comprova a proteção
            </h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              O Sistema Master Block IoT não para na instalação do filtro. Um software de gestão
              on-line de qualidade de energia acompanha, em tempo real, a eficácia do Master Block
              na retenção dos picos de tensão, a sua vida útil e as condições gerais de qualidade
              de energia da rede.
            </p>
            <p className="leading-relaxed text-[rgb(var(--text-muted))]">
              O sistema calcula continuamente o tempo de uso dos ativos e os níveis de distorção
              harmônica (THDv) — e, como a tolerância dos equipamentos cai conforme envelhecem,
              aponta quando os níveis já não são adequados e sugere um plano de ação preventivo.{' '}
              <span className="font-semibold text-[rgb(var(--text))]">
                É a diferença entre proteger e comprovar que está protegendo.
              </span>
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { title: 'Monitoramento contínuo', description: 'Nenhum DPS comum oferece acompanhamento on-line da qualidade de energia da rede.' },
              { title: 'Inspeções periódicas', description: 'Três visitas por ano avaliam as condições físicas do Master Block e da instalação.' },
              { title: 'Plano de ação preventivo', description: 'O sistema antecipa riscos com base na idade do ativo e nos níveis de THDv.' },
            ].map((h, i) => (
              <Reveal key={h.title} delay={i * 60} className="card-elevated flex flex-col gap-2 p-6">
                <span className="font-sans text-base font-semibold text-[rgb(var(--text))]">
                  {h.title}
                </span>
                <span className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                  {h.description}
                </span>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* ── Proteção em cascata (INDUSTRIAL) ──────────────────────────
          ⚠️ Esta seção descreve o projeto INDUSTRIAL, onde a planta tem
          subestação, vários setores e equipamento crítico espalhado. Ela
          estava sem dizer isso, e /produtos está no menu principal: um dono
          de comércio lia "um único supressor não basta" logo depois de a LP
          dele dizer o contrário — desde 03/09 o não-industrial leva UM
          Master Block, no quadro de entrada.

          O enquadramento é o conserto certo, não apagar: na indústria a
          cascata continua sendo o projeto correto. */}
      <section className="band-navy text-white">
        <div className="container-msm py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal className="space-y-5">
              <span className="inline-block rounded-btn border border-white/25 px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                Projeto industrial
              </span>
              <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
                Proteção em cascata + aterramento dedicado
              </h2>
              <p className="text-white/80 leading-relaxed">
                Na indústria, onde a planta tem subestação, vários setores e equipamento
                crítico espalhado, um único supressor junto ao equipamento sensível não
                basta — ele fica sujeito a um surto acima da sua capacidade de escoamento.
                A Somatec projeta a proteção em cascata: um MasterBlock na entrada da
                instalação, outro no quadro de distribuição e outro próximo ao equipamento
                crítico, atenuando o surto gradativamente.
              </p>
              <p className="text-white/80 leading-relaxed">
                E porque o desempenho depende do referencial de terra, instalamos um
                sistema de aterramento próprio e exclusivo, com equipotencialização
                conforme o capítulo de aterramento da NBR 5410.
              </p>
              <p className="rounded-card border border-white/15 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/75">
                <span className="font-semibold text-white">Comércio e residência é diferente:</span>{' '}
                um único Master Block no quadro de entrada protege a instalação inteira, e a
                escolha do modelo sai da corrente do disjuntor geral.{' '}
                <Link href="/protecao-comercial" className="font-semibold text-gold underline-offset-2 hover:underline">
                  Ver a proteção do comércio
                </Link>{' '}
                ·{' '}
                <Link href="/protecao-residencial" className="font-semibold text-gold underline-offset-2 hover:underline">
                  da casa
                </Link>
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
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Qual MasterBlock a sua planta precisa?
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Calcule quanto as paradas e queimas custam por ano na sua operação — em 2 minutos. Ou
            fale direto com a engenharia da Somatec para um projeto de mitigação de surtos e
            transientes sob medida.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/ferramentas/custo-de-parada" className="btn-primary group">
              Calcular meu prejuízo
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
            <CommercialCta
              label="Falar com a engenharia"
              mensagem="Olá! Vim pelo site, vi a linha Master Block e queria ajuda pra saber qual modelo serve pro meu caso."
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
