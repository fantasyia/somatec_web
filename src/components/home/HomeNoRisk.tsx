/**
 * Modelo comercial da locação industrial — o diferencial mais forte do
 * playbook.
 *
 * ⛔ MUDOU EM 03/09. Não existe mais período de avaliação, e o argumento
 * deixou de ser "só paga se o resultado for comprovado". O modelo agora é:
 * assina o contrato → instala (até aqui não paga nada) → a primeira
 * mensalidade vence 30 dias depois → a partir de 12 meses pode encerrar, e a
 * Somatec retira sem custo.
 *
 * O que segura o risco não é mais a prova, é o DIREITO DE SAÍDA. A ordem
 * continua importando: sem o contrato na frente, o texto lê como teste grátis
 * sem compromisso, que é a "medição prévia" extinta em 20/08 voltando por
 * outro caminho.
 *
 * 🔒 A duração do contrato é dado INTERNO e não pode aparecer aqui. Os 12
 * meses são o prazo pra encerrar sem custo — nunca a duração do contrato.
 */
import Link from 'next/link';
import { ChevronRight, Network } from 'lucide-react';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { LocacaoTimeline } from '@/components/home/LocacaoTimeline';

export function HomeNoRisk() {
  return (
    <section aria-label="Como funciona a locação industrial">
      <div className="container-msm section-y">
        {/* O chip "Locação · Indústria" SAIU: eyebrow/kicker não é padrão da
            marca. O público agora é sinalizado pela própria copy — "Na
            indústria…", "na sua planta", "a sua operação" são vocabulário que
            só o industrial usa, e dizem público + oferta como frase, não como
            rótulo. */}
        <div className="max-w-3xl space-y-4">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Instalamos na sua planta. Se não valer a pena, a gente retira.
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Na indústria, o Master Block trabalha por locação. Você assina o contrato, a engenharia
            faz o estudo da rede, o projeto e a proposta, e a gente instala —{' '}
            <span className="font-semibold text-[rgb(var(--text))]">
              até a instalação você não paga nada
            </span>
            . A primeira mensalidade vence 30 dias depois. E a partir de 12 meses, se não estiver
            satisfeito ou simplesmente não quiser mais, a Somatec retira o equipamento sem custo e
            encerra o contrato.
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
            label="Quero o Master Block na minha planta"
            mensagem="Olá! Vim pelo site e quero o Master Block na minha fábrica."
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
