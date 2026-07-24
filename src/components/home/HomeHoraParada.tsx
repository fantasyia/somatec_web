import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { HoraParadaChart } from '@/components/home/HoraParadaChart';

/**
 * Módulo "hora parada" (despacho banda navy): espelha a diagramação de
 * "Onde todo DPS para" — banda NAVY, texto + CTA à ESQUERDA, gráfico
 * ilustrativo à DIREITA ("a conta que soma": barra empilhada dos 5 custos
 * cruzando a linha da mensalidade). Os chips viraram os rótulos dos
 * segmentos da barra (morre a redundância chip+texto).
 * 1 foco laranja = CTA + o excedente "já paga a conta" do gráfico.
 */
export function HomeHoraParada() {
  return (
    <section className="band-navy text-white" aria-label="Uma hora parada por mês já paga a conta">
      <div className="container-msm section-y">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="space-y-4 lg:col-span-5">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance text-white">
              Uma hora parada por mês já paga a conta.
            </h2>
            <p className="text-white/85 leading-relaxed">
              Numa fábrica do porte que o Master Block protege, uma única hora
              de linha parada por mês já supera o valor da mensalidade. E ela
              nunca vem sozinha — calcule quanto custa a sua.
            </p>
            <div className="pt-2">
              <Link href="/ferramentas/custo-de-parada" className="btn-primary group inline-flex">
                Calcular o prejuízo da minha parada
                <ChevronRight
                  className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120} className="relative lg:col-span-7">
            {/* Glow ambiente — mesma luz de palco do gráfico do DPS. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(60%_60%_at_55%_45%,rgba(0,140,200,0.22)_0%,transparent_70%)] blur-2xl"
            />
            <div className="relative rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 text-[rgb(var(--text))] shadow-premium-light md:p-8">
              <HoraParadaChart />
              <p className="mt-2 text-[11px] leading-relaxed text-[rgb(var(--text-muted))]">
                Representação ilustrativa — as proporções variam por operação; a
                calculadora usa os números da sua planta.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
