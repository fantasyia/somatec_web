/**
 * Seção "categoria de um": mostra (não só diz) o argumento central — o DPS
 * comum para em 10 kHz; o Master Block atua até 100 kHz. O gráfico
 * FrequencySpectrum se desenha ao entrar no viewport.
 */
import { Reveal } from '@/components/ui/Reveal';
import { FrequencySpectrum } from '@/components/graphics/FrequencySpectrum';

export function HomeFrequency() {
  return (
    <section
      className="container-msm py-16 md:py-24"
      aria-label="Comparativo de frequência: DPS comum versus Master Block"
    >
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <Reveal className="space-y-4 lg:col-span-5">
          <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
            Onde todo DPS para, o Master Block continua atuando
          </h2>
          <p className="text-[rgb(var(--text-muted))] leading-relaxed">
            Dispositivos de proteção convencionais atuam até{' '}
            <span className="font-semibold text-[rgb(var(--text))]">10 kHz</span>. Só que os
            distúrbios que travam máquinas, queimam placas e param a produção — surtos,
            transientes e VTCD — acontecem em frequências muito mais altas. O filtro passivo do
            Master Block atua em{' '}
            <span className="font-semibold text-gold">100 kHz</span>: exatamente na faixa em que
            o resto do mercado é cego.
          </p>
          <p className="text-sm text-[rgb(var(--text-muted))] leading-relaxed">
            Por isso indústrias que já haviam instalado DPS de grandes marcas seguiam tendo
            prejuízo — e resolveram com a Somatec.
          </p>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-7">
          <div className="rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 text-[rgb(var(--text))] md:p-8">
            <FrequencySpectrum />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
