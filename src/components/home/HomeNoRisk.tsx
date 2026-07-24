/**
 * Modelo comercial "investimento sem risco" — o diferencial mais forte do
 * playbook: os 5 primeiros passos são sem custo e o cliente só paga se
 * aprovar o resultado. Band navy para máximo contraste.
 */
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
            <span className="font-semibold text-[rgb(var(--text))]">sem custo</span>. Você só passa a pagar a
            mensalidade se, ao fim do teste de 60 a 90 dias, aprovar o resultado na sua própria
            operação. Se não houver resultado, retiramos os equipamentos — sem custo algum.
          </p>
        </div>

        {/* Timeline conectada (#16-D): linha preenche + nós acendem em sequência. */}
        <div className="mt-12">
          <LocacaoTimeline />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <CommercialCta
            label="Solicitar diagnóstico gratuito"
            context="Modelo sem risco (home)"
            fallbackPath="/contato"
          />
          <p className="text-sm text-[rgb(var(--text-muted))] max-w-md leading-relaxed">
            O saving costuma superar em{' '}
            <span className="font-bold text-gold">30% o valor da parcela</span> — em alguns casos,
            várias vezes mais.
          </p>
        </div>
      </div>
    </section>
  );
}
