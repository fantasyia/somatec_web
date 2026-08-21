/**
 * Modelo comercial "investimento sem risco" — o diferencial mais forte do
 * playbook: os 5 primeiros passos são sem custo e o cliente só paga se
 * aprovar o resultado. Band navy para máximo contraste.
 */
import Link from 'next/link';
import { ChevronRight, Network } from 'lucide-react';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { LocacaoTimeline } from '@/components/home/LocacaoTimeline';

export function HomeNoRisk() {
  return (
    <section aria-label="Investimento sem risco">
      <div className="container-msm section-y">
        <div className="max-w-3xl space-y-4">
          {/* Rótulo do modelo (despacho #15) — chip, não eyebrow. */}
          <span className="inline-flex items-center rounded-full bg-cyan/10 px-3 py-1 font-sans text-xs font-semibold text-cyan">
            Locação · Indústria
          </span>
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Você só paga quando o resultado é comprovado
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Estudo, projeto, proposta, instalação e período de avaliação: tudo{' '}
            <span className="font-semibold text-[rgb(var(--text))]">sem custo</span>. O período de
            avaliação — de 60 a 90 dias — é definido pela análise do software, que mede até ter
            dados suficientes pra comprovar (ou não) o resultado na sua operação. Você só passa a
            pagar a mensalidade se aprovar o resultado. Se não houver, retiramos os equipamentos —
            sem custo algum.
          </p>
        </div>

        {/* Timeline conectada (#16-D): linha preenche + nós acendem em sequência. */}
        <div className="mt-12">
          <LocacaoTimeline />
        </div>

        {/* Adendo #16-A: a legenda do saving (30%) saiu daqui — o argumento
            subiu de nível e virou o módulo "Uma hora parada por mês já paga
            a conta" (HomeHoraParada), logo abaixo. */}
        <div className="mt-10">
          <CommercialCta
            label="Solicitar diagnóstico gratuito"
            mensagem="Olá! Vim pelo site e quero o diagnóstico gratuito da rede da minha fábrica."
            fallbackPath="/contato"
          />
        </div>

        {/* Auto-orçamento industrial: ganhou bloco próprio (era um botão
            fantasma que sumia ao lado do CTA laranja). Seção é CLARA
            (tone-surface) — botão navy sólido: alto contraste sem disputar o
            laranja, que já é do CTA de diagnóstico. */}
        <div className="mt-8 flex flex-col gap-4 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-gold/15 text-gold">
              <Network className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <span className="block font-sans text-base font-semibold text-[rgb(var(--text))]">
                Monte o projeto da sua planta em 2 minutos
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                Você já sai com a estimativa de locação na tela — sem esperar representante.
              </span>
            </div>
          </div>
          <Link
            href="/orcamento-industrial"
            className="group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-btn bg-deep_navy px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-navy-700"
          >
            Montar o projeto
            <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
