/**
 * Faixa "empresas que confiam" — prova social logo abaixo da hero.
 * Clientes reais citados no playbook de vendas. Enquanto não há os
 * arquivos oficiais de logo, exibimos os nomes como wordmarks (padrão
 * "trusted by"); trocar por <Image> quando os logos chegarem.
 */
import { Reveal } from '@/components/ui/Reveal';

const CLIENTS = [
  'BASF',
  'Akzo Nobel',
  'Tintas Coral',
  'Acrilex',
  'Nissin Foods',
  'Extrafarma',
  'Cinpal',
  'Stampline',
  'Grow Up',
  'Kostal',
] as const;

export function HomeClients() {
  return (
    <section
      className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
      aria-label="Empresas que confiam na Somatec Blocking"
    >
      <div className="container-msm py-8 md:py-10">
        <Reveal className="flex flex-col items-center gap-6">
          <p className="text-[11px] md:text-xs font-sans font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
            Indústrias que confiam na Somatec Blocking
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12">
            {CLIENTS.map((name) => (
              <li
                key={name}
                className="font-sans text-lg md:text-xl font-bold tracking-tight text-[rgb(var(--text-muted))]/70 transition-colors hover:text-[rgb(var(--text))]"
              >
                {name}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
