/**
 * Seção editorial enxuta — substitui o antigo HomeSolutions (grid de 6 cards)
 * que tinha overlap com HomeCta + HomeCarousel.
 *
 * Apenas tipografia + uma quebra de linha forte. Sem ícones, sem cards.
 * O peso vem do contraste de tamanho e do espaçamento generoso.
 */
export function HomeManifesto() {
  return (
    <section
      className="bg-[rgb(var(--surface))] border-y border-[rgb(var(--border))]"
      aria-label="Manifesto Somatec"
    >
      <div className="container-msm py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-serif font-semibold text-h2-m md:text-h2-d text-balance leading-[1.15] text-[rgb(var(--text))]">
            Não é um DPS comum. É a proteção que{' '}
            <span className="text-gold">o surto não vence</span>.
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-[rgb(var(--text-muted))] text-pretty max-w-2xl mx-auto">
            Os VTCD — variações de tensão de curta duração, abaixo de 1 segundo — queimam
            placas, CLP e inversores e param a produção. O Master Block atua em 100 kHz, a
            frequência onde os DPS comuns não chegam, e o software de gestão on-line comprova
            a eficiência em dados. Segundo a CNI, 67% da indústria nacional sofre prejuízos
            com má qualidade de energia. A nossa engenharia já protege as maiores indústrias
            do Brasil.
          </p>
        </div>
      </div>
    </section>
  );
}
