import type { Metadata } from 'next';
import { Network, Clock, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { ProofBadges } from '@/components/ui/ProofBadges';
import { OrcamentoIndustrial } from '@/components/tools/OrcamentoIndustrial';
import { DiagramaExemploIndustrial } from '@/components/lp/DiagramaExemploIndustrial';
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

// Exemplo ILUSTRATIVO (não é o documento de nenhum cliente) — mantém a ordem de
// grandeza de uma planta cheia; espelha o diagrama próprio ao lado.
const EXEMPLO = [
  { se: 'Subestação 1', trafo: '1× 1000 kVA', setor: 'Injeção — 6 robôs + 12 injetoras' },
  { se: 'Subestação 2', trafo: '1× 2000 kVA', setor: 'Usinagem — 6 robôs' },
  { se: 'Subestação 3', trafo: '2× 2000 kVA', setor: 'Acabamento — 13 injetoras' },
  { se: 'Subestação 4', trafo: '2× 750 kVA', setor: 'Administrativo — servidores, CFTV' },
];

export default async function OrcamentoIndustrialPage() {
  const config = await getWhatsAppButtonConfig();
  const zapHref = buildCommercialCtaHref(config, {
    mensagem: 'Olá! Vim pelo site e quero um orçamento de proteção pra linha de produção da minha fábrica.',
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
              <span className="font-semibold text-gold">proteção em cascata</span> e você já sai com a
              estimativa de locação na tela — sem esperar representante.
            </p>
            <div className="flex flex-wrap gap-6 pt-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-2"><Network className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden="true" /> Mapa em cascata</span>
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden="true" /> Resposta em ≤3h úteis</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden="true" /> 26 anos sem acidentes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────
          Os 14 artigos do blog trazem pra cá o CTA "Avalie o Master Block na
          sua planta: 60 a 90 dias, e você só paga se o resultado for
          comprovado". Quem chega precisa reencontrar ESSA promessa — antes
          daqui a página falava só em estimativa de locação, e o leitor caía
          numa oferta diferente da que clicou.

          Texto conforme a redação aprovada dos artigos (25/08). ⛔ Não vira
          medição prévia nem oferta de software avulso: a medição acontece
          DEPOIS do contrato, dentro da avaliação. */}
      <div className="tone-surface">
        <section className="container-msm section-y" aria-label="Como funciona a avaliação">
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-card-lg border border-cyan/30 bg-cyan/5 p-6 md:p-8">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">
                Avaliação na sua planta
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-[rgb(var(--text))] md:text-[1.75rem]">
                Você só paga se o resultado for comprovado.
              </h2>
              <p className="mt-3 text-[17px] leading-[1.8] text-[rgb(var(--text))]">
                As cinco primeiras etapas são sem custo: levantamento técnico da rede, projeto,
                proposta, instalação e a própria avaliação. O resultado é medido na sua planta, ao
                longo de <span className="font-semibold">60 a 90 dias</span>, com o software do
                Master Block mostrando o antes e o depois em tempo real.
              </p>
              <p className="mt-3 text-[17px] leading-[1.8] text-[rgb(var(--text))]">
                Se o resultado não for comprovado, os equipamentos são retirados sem custo.
              </p>
            </div>
          </Reveal>
        </section>
      </div>

      {/* ── WIZARD + EXEMPLO ──────────────────────────────────────── */}
      <div className="tone-base">
        <section className="container-msm section-y" aria-label="Montar projeto">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-7">
              <OrcamentoIndustrial landingSlug={SLUG} whatsappHref={zapHref} whatsappExternal={zapExternal} />
            </Reveal>

            {/* Exemplo ilustrativo — resumo em tabela ao lado do wizard */}
            <Reveal delay={120} className="lg:col-span-5">
              <div className="rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
                <h2 className="font-serif text-lg font-semibold text-[rgb(var(--text))]">
                  Veja como fica um projeto
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                  Uma planta industrial: entrada em 69 kV → subestação → 4 subestações internas →
                  galpões → dezenas de servomotores, servobombas e inversores. É a árvore que você
                  monta ao lado.
                </p>

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

          {/* Diagrama em largura cheia — desenho próprio (não é o documento de
              nenhum cliente): mesma estrutura didática, mais os pontos de
              proteção em cascata acendendo, que o unifilar comum não mostra. */}
          <Reveal delay={80} className="mt-8">
            <div className="rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 md:p-8">
              <h2 className="font-serif text-lg font-semibold text-[rgb(var(--text))]">
                Onde o Master Block entra na planta
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[rgb(var(--text-muted))]">
                Da entrada da rede até o painel de cada galpão. Cada ponto laranja é uma camada da{' '}
                <span className="font-semibold text-gold">proteção em cascata</span> — é isso que o
                seu projeto vai mostrar.
              </p>
              <div className="mt-6">
                <DiagramaExemploIndustrial />
              </div>
            </div>
          </Reveal>
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
