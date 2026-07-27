import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { DEFAULT_OG_IMAGES } from '@/lib/constants/site';
import { SOLUCOES, getSolucao } from '@/lib/constants/solucoes';

export const revalidate = 3600;

export function generateStaticParams() {
  return SOLUCOES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getSolucao(slug);
  if (!s) return { title: 'Solução não encontrada' };
  const description = `${s.tagline}. ${s.intro[0]}`.slice(0, 300);
  return {
    title: `${s.title} — Somatec Blocking`,
    description,
    alternates: { canonical: `/solucoes/${s.slug}` },
    openGraph: {
      title: `${s.title} — Somatec Blocking`,
      description,
      url: `/solucoes/${s.slug}`,
      type: 'website',
      images: [...DEFAULT_OG_IMAGES],
    },
    robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
  };
}

export default async function SolucaoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getSolucao(slug);
  if (!s) notFound();
  const { Icon } = s;

  return (
    <>
      <PageHero
        title={s.title}
        description={s.tagline}
        breadcrumbs={[{ label: 'Soluções', href: '/solucoes' }, { label: s.title }]}
      />

      <section className="container-msm py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Texto */}
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-btn bg-gold/10 text-gold">
              <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
            </span>
            {s.intro.map((p, i) => (
              <p key={i} className="text-[rgb(var(--text-muted))] leading-relaxed text-pretty">
                {p}
              </p>
            ))}
          </div>

          {/* Destaques */}
          <div className="lg:col-span-5 space-y-4">
            {/* h2 só pra leitor de tela: mantém a ordem h1→h2→h3 (cards) sem mudar o visual */}
            <h2 className="sr-only">Destaques da solução</h2>
            {s.highlights.map((h) => (
              <div
                key={h.title}
                className="flex gap-3.5 card-elevated p-5"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-cyan/10 text-cyan">
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-sans font-semibold text-sm text-[rgb(var(--text))]">{h.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                    {h.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 md:mt-20 max-w-3xl mx-auto text-center space-y-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            {s.cta}
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Fale com a engenharia da Somatec Blocking e receba um diagnóstico da sua planta,
            sem custo.
          </p>
          <CommercialCta
            label="Falar com a engenharia"
            context={s.title}
            fallbackPath="/contato"
            className="inline-flex"
          />
        </div>
      </section>
    </>
  );
}
