/**
 * Prova social — cases reais quantificados do playbook de vendas Somatec.
 * Números e empresas conforme material comercial oficial (case Cinpal,
 * Nissin, Stampline, Grow Up) + selo FIESP + linha de grandes marcas.
 */
import { Award, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { CaseChart } from '@/components/home/CaseChart';

type Case = {
  metric: string;
  unit: string;
  company: string;
  sector: string;
  description: string;
};

const CASES: readonly Case[] = [
  {
    metric: '92%',
    unit: 'de supressão de VTCD',
    company: 'Cinpal',
    sector: 'Autopeças · Taboão da Serra-SP',
    description:
      'Medição com dois analisadores por 80 dias comprovou a supressão e cessou prejuízos de ~R$120 mil/mês com paradas.',
  },
  {
    metric: '~R$1 mi',
    unit: 'por ano economizados',
    company: 'Nissin Foods',
    sector: 'Alimentícia · Ibiúna-SP',
    description:
      'Redução de falhas na inspeção e da queima de placas das máquinas de empacotamento — só em manutenção.',
  },
  {
    metric: 'R$560 mil',
    unit: 'por ano em placas',
    company: 'Stampline',
    sector: 'Metalúrgica · Limeira-SP',
    description:
      'Fim do travamento diário de computadores (40 min/dia de reprogramação) e da queima de placas eletrônicas.',
  },
  {
    metric: '4 dias',
    unit: 'de produção salvos por mês',
    company: 'Grow Up',
    sector: 'Têxtil · Cascavel-PR',
    description:
      'Eliminação das queimas frequentes de equipamentos, que chegavam a parar até 4 dias por mês — mais de 13% da produção mensal.',
  },
];

export function HomeProof() {
  return (
    <section
      className="container-msm py-16 md:py-24"
      aria-label="Cases e prova social"
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
      <Reveal className="mb-10">
        <CaseChart />
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CASES.map((c) => (
          <Reveal
            key={c.company}
            className="flex flex-col rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 h-full"
          >
            <div className="font-serif font-bold text-indicator-m leading-none text-gold">
              {c.metric}
            </div>
            <div className="mt-1.5 text-xs font-sans font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
              {c.unit}
            </div>
            <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
              <div className="font-sans font-bold text-base text-[rgb(var(--text))]">{c.company}</div>
              <div className="text-[11px] uppercase tracking-wide text-[rgb(var(--text-muted))] mb-2">
                {c.sector}
              </div>
              <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{c.description}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Selo FIESP + marcas de confiança */}
      <Reveal className="mt-10 pt-8 border-t border-[rgb(var(--border))] flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
        <div className="inline-flex items-center gap-3 shrink-0">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-gold/10 text-gold">
            <Award className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="text-sm">
            <div className="font-sans font-bold text-[rgb(var(--text))]">Prêmio FIESP</div>
            <div className="text-[rgb(var(--text-muted))]">Concurso Acelera Startup 2015</div>
          </div>
        </div>
        <div className="flex items-start gap-3 lg:border-l lg:border-[rgb(var(--border))] lg:pl-10">
          <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-cyan" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-sm text-[rgb(var(--text-muted))] leading-relaxed">
            Entre os clientes atendidos: <span className="font-semibold text-[rgb(var(--text))]">BASF,
            Akzo Nobel / Tintas Coral, Acrilex, Extrafarma, Nissin Foods</span> e outras indústrias
            de referência.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
