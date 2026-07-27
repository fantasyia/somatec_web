import type { Metadata } from 'next';
import { Network, Clock, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { ProofBadges } from '@/components/ui/ProofBadges';
import { OrcamentoIndustrial } from '@/components/tools/OrcamentoIndustrial';
import {
  buildCommercialCtaHref,
  getWhatsAppButtonConfig,
  isExternalCtaHref,
} from '@/lib/whatsapp-button';

/**
 * Auto-orçamento INDUSTRIAL (trilha de LOCAÇÃO) — o cliente remonta a árvore da
 * planta (o "projeto mastigado") e recebe a proposta de locação via rep.
 * Spec: calculadora-industrial-estrutura.md. Triagem por grupo tarifário A/B
 * dentro do wizard (Grupo A = industrial; Grupo B → compra direta NI).
 * Exemplo pré-montado (Moura Un05) ao lado. NOINDEX (pré-lançamento).
 */

const SLUG = 'orcamento-industrial';

export const metadata: Metadata = {
  title: { absolute: 'Monte o projeto de proteção da sua planta | Master Block' },
  description:
    'Remonte a árvore da sua planta — da entrada de energia a cada máquina — e receba a proposta de proteção em cascata do Master Block. Resposta do representante em até 3 horas úteis.',
  alternates: { canonical: `/${SLUG}` },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export const revalidate = 3600;

// Exemplo Moura Un05 (transcrição fiel — calculadora-industrial-estrutura.md)
const EXEMPLO = [
  { se: 'SE 01', trafo: '2× 750 kVA', setor: 'G01 + Administrativo' },
  { se: 'SE 02', trafo: '1× 1000 kVA', setor: 'G02 — 6 robôs + 12 injetoras' },
  { se: 'SE 03', trafo: '1× 2000 kVA', setor: 'Repla' },
  { se: 'SE 04', trafo: '2× 2000 kVA', setor: 'G03 + G04 — 6 robôs + 25 injetoras' },
];

export default async function OrcamentoIndustrialPage() {
  const config = await getWhatsAppButtonConfig();
  const zapHref = buildCommercialCtaHref(config, {
    context: 'Auto-orçamento industrial (/orcamento-industrial)',
    fallbackPath: '/contato',
  });
  const zapExternal = isExternalCtaHref(zapHref);

  return (
    <>
      {/* ── HERO (navy) ───────────────────────────────────────────── */}
      <section className="band-navy text-white" aria-label="Auto-orçamento industrial">
        <div className="container-msm section-y pt-28 md:pt-32">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full bg-cyan/15 px-3 py-1 font-sans text-xs font-semibold text-cyan">
              Locação · Indústria
            </span>
            <h1 className="font-serif text-[2rem] leading-[1.1] font-semibold text-balance sm:text-[2.5rem] lg:text-[3rem]">
              Monte o projeto de proteção da sua planta — da entrada de energia a cada máquina.
            </h1>
            <p className="max-w-[620px] text-base leading-relaxed text-white/85 text-pretty md:text-lg">
              Remonte a árvore da sua instalação como no projeto real de uma indústria. Você vai
              colocando os números; a ferramenta monta o mapa de{' '}
              <span className="font-semibold text-gold">proteção em cascata</span> e um representante
              volta com a proposta de locação em até 3 horas úteis.
            </p>
            <div className="flex flex-wrap gap-6 pt-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-2"><Network className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden="true" /> Mapa em cascata</span>
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden="true" /> Resposta em ≤3h úteis</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden="true" /> 26 anos sem acidentes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── WIZARD + EXEMPLO ──────────────────────────────────────── */}
      <div className="tone-base">
        <section className="container-msm section-y" aria-label="Montar projeto">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-7">
              <OrcamentoIndustrial landingSlug={SLUG} whatsappHref={zapHref} whatsappExternal={zapExternal} />
            </Reveal>

            {/* Exemplo pré-montado (Moura Un05) */}
            <Reveal delay={120} className="lg:col-span-5">
              <div className="rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
                <h2 className="font-serif text-lg font-semibold text-[rgb(var(--text))]">
                  Veja um projeto real
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                  Uma planta industrial: entrada em 69 kV → subestação → 4 subestações internas →
                  galpões → dezenas de servomotores, servobombas e inversores. É a árvore que você
                  monta acima.
                </p>

                {/* Slot do diagrama-exemplo (imagem chega do Léo) */}
                <div className="mt-4 flex aspect-[4/3] w-full items-center justify-center rounded-card border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-center">
                  <span className="px-6 text-xs text-[rgb(var(--text-muted))]">
                    Diagrama unifilar do projeto exemplo<br />(em preparação)
                  </span>
                </div>

                <div className="mt-5 overflow-hidden rounded-card border border-[rgb(var(--border))]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[rgb(var(--bg))] text-[rgb(var(--text-muted))]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Subestação</th>
                        <th className="px-3 py-2 font-semibold">Trafo</th>
                        <th className="px-3 py-2 font-semibold">Setor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                      {EXEMPLO.map((r) => (
                        <tr key={r.se}>
                          <td className="px-3 py-2 font-semibold text-[rgb(var(--text))]">{r.se}</td>
                          <td className="px-3 py-2 text-[rgb(var(--text-muted))]">{r.trafo}</td>
                          <td className="px-3 py-2 text-[rgb(var(--text-muted))]">{r.setor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-[rgb(var(--text-muted))]">
                  ~63 servomotores · ~31 servodrivers · ~12 servobombas · ~4 inversores — a ordem de
                  grandeza de uma planta cheia.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      {/* ── PROVA ─────────────────────────────────────────────────── */}
      <div className="tone-surface">
        <section className="container-msm section-y" aria-label="Prova">
          <Reveal>
            <ProofBadges />
          </Reveal>
        </section>
      </div>
    </>
  );
}
