import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { CaseChart } from '@/components/home/CaseChart';
import { CountUp } from '@/components/ui/CountUp';
import { CASES, CLIENTES } from '@/lib/constants/cases';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';

export const metadata: Metadata = {
  title: 'Resultados — cases reais medidos na planta | Somatec Blocking',
  description:
    'Cases reais com número: Cinpal (92% de supressão de VTCD), Nissin (~R$1 mi/ano), Stampline (R$560 mil/ano), Grow Up (4 dias/mês). Medição antes e depois da instalação do Master Block.',
  alternates: { canonical: '/resultados' },
  openGraph: {
    title: 'Resultados — cases reais medidos na planta',
    description: 'Números comprovados por medição antes e depois da instalação do Master Block.',
    url: '/resultados',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export const revalidate = 3600;

export default function ResultadosPage() {
  return (
    <>
      <PageHero
        title="Números reais, medidos na planta do cliente"
        description="Grandes indústrias que já haviam tentado de tudo — inclusive com Weg, Siemens e Schneider — só resolveram as paradas e queimas com a Somatec Blocking. Cada resultado é comprovado por medição antes e depois da instalação."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Resultados' }]}
      />

      {/* Prova técnica em figura */}
      <section className="container-msm py-14 md:py-20" aria-label="Prova técnica antes e depois">
        <Reveal>
          <CaseChart />
        </Reveal>
      </section>

      {/* Cases detalhados */}
      <section className="container-msm pb-8 md:pb-12" aria-label="Cases">
        <div className="space-y-5">
          {CASES.map((c, i) => (
            <Reveal
              key={c.slug}
              delay={i * 60}
              className="grid gap-6 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 md:grid-cols-[220px_1fr] md:p-8"
            >
              <div className="md:border-r md:border-[rgb(var(--border))] md:pr-6">
                <div className="font-serif text-indicator-m font-bold leading-none text-gold">
                  <CountUp value={c.metric} />
                </div>
                <div className="mt-1.5 text-xs font-sans font-semibold text-[rgb(var(--text-muted))]">
                  {c.unit}
                </div>
                <div className="mt-4">
                  <div className="font-sans text-base font-bold text-[rgb(var(--text))]">{c.company}</div>
                  <div className="text-[11px] text-[rgb(var(--text-muted))]">
                    {c.sector} · {c.city}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[15px] leading-relaxed text-[rgb(var(--text-muted))] md:text-base">
                  {c.detail}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {c.industria && (
                    <Link
                      href={`/industrias/${c.industria}`}
                      className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-gold transition-colors hover:text-gold-soft"
                    >
                      Ver solução para {c.sector.toLowerCase()}
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded text-[11px] font-sans font-semibold text-[rgb(var(--text-muted))] opacity-70">
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    Laudo em PDF · em breve
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Selo FIESP + credibilidade */}
      <section className="container-msm pb-12" aria-label="Credibilidade">
        <Reveal className="flex flex-col gap-6 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 md:flex-row md:items-center md:gap-10 md:p-8">
          <div className="inline-flex shrink-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-gold/10 text-gold">
              <Award className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="text-sm">
              <div className="font-sans font-bold text-[rgb(var(--text))]">Prêmio FIESP</div>
              <div className="text-[rgb(var(--text-muted))]">Concurso Acelera Startup 2015</div>
            </div>
          </div>
          <div className="flex items-start gap-3 md:border-l md:border-[rgb(var(--border))] md:pl-10">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">
              Entre as indústrias atendidas:{' '}
              <span className="font-semibold text-[rgb(var(--text))]">{CLIENTES.join(', ')}</span> e outras
              referências do setor.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="bg-deep_navy text-white" aria-label="Chamada para diagnóstico">
        <div className="container-msm py-14 text-center md:py-20">
          <Reveal className="mx-auto max-w-2xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              O próximo número comprovado pode ser o da sua planta
            </h2>
            <p className="text-white/80 leading-relaxed">
              A medição na sua rede é sem custo. Você só passa a pagar se o resultado for comprovado
              na sua própria operação.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/ferramentas/custo-de-parada" className="btn-primary group">
                Calcular meu prejuízo
                <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center rounded-btn border border-white/40 px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:border-gold hover:text-gold"
              >
                Solicitar diagnóstico
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
