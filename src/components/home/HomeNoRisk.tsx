/**
 * Modelo comercial "investimento sem risco" — o diferencial mais forte do
 * playbook: os 5 primeiros passos são sem custo e o cliente só paga se
 * aprovar o resultado. Band navy para máximo contraste.
 */
import { Search, PencilRuler, FileText, Wrench, GaugeCircle } from 'lucide-react';
import { CommercialCta } from '@/components/ui/CommercialCta';
import { Reveal } from '@/components/ui/Reveal';

const STEPS = [
  { Icon: Search, label: 'Estudo da rede' },
  { Icon: PencilRuler, label: 'Projeto do sistema' },
  { Icon: FileText, label: 'Proposta técnica' },
  { Icon: Wrench, label: 'Instalação' },
  { Icon: GaugeCircle, label: 'Período de avaliação' },
] as const;

export function HomeNoRisk() {
  return (
    <section className="bg-deep_navy text-white" aria-label="Investimento sem risco">
      <div className="container-msm py-16 md:py-24">
        <div className="max-w-3xl space-y-4">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Você só paga quando o resultado é comprovado
          </h2>
          <p className="text-white/80 leading-relaxed">
            Estudo, projeto, proposta, instalação e período de avaliação: tudo{' '}
            <span className="font-semibold text-white">sem custo</span>. Você só passa a pagar a
            mensalidade se, ao fim do teste de 60 a 90 dias, aprovar o resultado na sua própria
            operação. Se não houver resultado, retiramos os equipamentos — sem custo algum.
          </p>
        </div>

        {/* Passos */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4">
          {STEPS.map(({ Icon, label }, i) => (
            <Reveal
              key={label}
              delay={i * 70}
              className="relative rounded-card border border-white/10 bg-white/[0.03] p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-btn bg-cyan/15 text-cyan mb-3">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="text-[11px] font-sans font-bold uppercase tracking-wide text-cyan/90">
                Passo {i + 1} · sem custo
              </div>
              <div className="mt-1 font-sans font-semibold text-sm text-white">{label}</div>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <CommercialCta
            label="Solicitar diagnóstico gratuito"
            context="Modelo sem risco (home)"
            fallbackPath="/contato"
          />
          <p className="text-sm text-white/60 max-w-md leading-relaxed">
            O saving costuma superar em 30% o valor da parcela — em alguns casos, várias vezes mais.
          </p>
        </div>
      </div>
    </section>
  );
}
