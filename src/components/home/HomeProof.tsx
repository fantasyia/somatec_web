/**
 * Prova em dados — gráfico antes/depois do case Cinpal (−92% VTCD).
 * Os case-cards e os selos foram FUNDIDOS na seção "Resultado real, setor
 * por setor" (HomeSetores) — aqui fica só a prova técnica em figura.
 */
import { Reveal } from '@/components/ui/Reveal';
import { CaseChart } from '@/components/home/CaseChart';

export function HomeProof() {
  return (
    <section
      className="container-msm section-y"
      aria-label="Prova em dados"
    >
      <Reveal className="max-w-3xl mb-12 space-y-4">
        <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
          Números reais, medidos na planta do cliente
        </h2>
        <p className="text-[rgb(var(--text-muted))] leading-relaxed">
          Grandes indústrias que já haviam tentado de tudo — inclusive com Weg, Siemens e
          Schneider — só resolveram as paradas e queimas com a Somatec Blocking. Cada resultado
          é comprovado por medição antes e depois da instalação.
        </p>
      </Reveal>

      {/* Prova técnica em figura: antes/depois do case Cinpal */}
      <Reveal>
        <CaseChart />
      </Reveal>
    </section>
  );
}
