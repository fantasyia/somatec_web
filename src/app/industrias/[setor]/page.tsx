import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { INDUSTRIAS, getIndustria } from '@/lib/constants/industrias';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';

// Só os setores listados existem — qualquer outro slug → 404 real (SEO).
export const dynamicParams = false;

export function generateStaticParams() {
  return INDUSTRIAS.map((i) => ({ setor: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setor: string }>;
}): Promise<Metadata> {
  const { setor } = await params;
  const ind = getIndustria(setor);
  if (!ind) return {};
  return {
    title: `Master Block para ${ind.nome} — proteção contra surtos e VTCD | Somatec Blocking`,
    description: `${ind.intro.slice(0, 150)}…`,
    alternates: { canonical: `/industrias/${ind.slug}` },
    openGraph: {
      title: `Proteção elétrica para ${ind.nome} — Master Block`,
      description: ind.heroTitle,
      url: `/industrias/${ind.slug}`,
      type: 'website',
      images: [...DEFAULT_OG_IMAGES],
    },
    robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
  };
}

export const revalidate = 3600;

export default async function IndustriaPage({
  params,
}: {
  params: Promise<{ setor: string }>;
}) {
  const { setor } = await params;
  const ind = getIndustria(setor);
  if (!ind) notFound();

  return (
    <>
      <PageHero
        title={ind.heroTitle}
        description={ind.intro}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resultados', href: '/resultados' },
          { label: ind.nome },
        ]}
      />

      {/* Sintomas do setor */}
      <section className="container-msm py-14 md:py-20" aria-label="Sintomas na sua planta">
        <Reveal className="mb-8 max-w-3xl space-y-3">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Os sinais na operação de {ind.nome.toLowerCase()}
          </h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {ind.sintomas.map((s, i) => (
            <Reveal
              key={s}
              delay={i * 70}
              className="rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-btn bg-gold/10 text-gold">
                <AlertTriangle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--text))]">{s}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-6 text-sm text-[rgb(var(--text-muted))]">
          Esses sintomas são o quadro clássico de VTCD e transientes de alta frequência — a faixa em
          que DPS, no-break e aterramento não atuam, mas o Master Block sim (100 kHz).
        </Reveal>
      </section>

      {/* Case do setor */}
      {ind.case && (
        <section className="bg-deep_navy text-white" aria-label={`Case ${ind.case.company}`}>
          <div className="container-msm py-14 md:py-20">
            <Reveal className="grid gap-8 md:grid-cols-[240px_1fr] md:items-center">
              <div>
                <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-white/55">
                  Case comprovado
                </span>
                <div className="mt-2 font-serif text-5xl font-bold leading-none text-gold md:text-6xl">
                  <CountUp value={ind.case.metric} />
                </div>
                <div className="mt-1.5 text-xs font-sans font-semibold uppercase tracking-wide text-white/60">
                  {ind.case.unit}
                </div>
                <div className="mt-4 text-sm">
                  <div className="font-sans font-bold text-white">{ind.case.company}</div>
                  <div className="text-white/55">{ind.case.city}</div>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-white/80 md:text-lg">{ind.case.detail}</p>
            </Reveal>
          </div>
        </section>
      )}

      {/* Modelo sem risco + CTA */}
      <section className="container-msm py-14 text-center md:py-20" aria-label="Diagnóstico">
        <Reveal className="mx-auto max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 text-cyan">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Prove na sua planta de {ind.nome.toLowerCase()}, sem custo
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Estudo da rede, projeto, instalação e avaliação de 60 a 90 dias — tudo sem custo. Você só
            passa a pagar se o resultado for comprovado na sua própria operação.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/ferramentas/custo-de-parada" className="btn-primary group">
              Calcular meu prejuízo
              <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center rounded-btn border border-deep_navy/30 px-5 py-2.5 font-sans text-sm font-medium text-deep_navy transition-colors hover:border-gold hover:text-gold dark:border-white/40 dark:text-white"
            >
              Solicitar diagnóstico
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
