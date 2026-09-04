'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

// =============================================================================
// Auto-diagnóstico de VTCD — 6 sintomas do playbook de vendas. Sim/não por
// pergunta; o score classifica o risco e direciona pra calculadora + contato.
// Sem backend: alimenta o argumento e o CTA (a captura fica na calculadora).
// =============================================================================

const QUESTIONS = [
  'Equipamentos travam ou reiniciam sozinhos, sem causa aparente?',
  'Queima de placas eletrônicas, fontes ou motores acontece com frequência?',
  'Sua produção sofre paradas não programadas?',
  'Você já tem DPS, no-break ou estabilizador — e o problema continua?',
  'Os problemas pioram em dias de chuva ou em horários específicos?',
  'Máquinas CNC ou CLPs precisam de reprogramação constante?',
] as const;

type Level = {
  min: number;
  label: string;
  Icon: typeof CheckCircle2;
  tone: string;
  text: string;
};

const LEVELS: Level[] = [
  {
    min: 4,
    label: 'Risco alto de VTCD',
    Icon: ShieldAlert,
    tone: 'text-gold',
    text: 'Esse conjunto de sintomas é o quadro clássico de VTCD e transientes de alta frequência — exatamente a faixa em que a proteção convencional não atua. Cada mês sem tratar é prejuízo recorrente — e a cobrança só começa 45 dias depois da nota fiscal.',
  },
  {
    min: 2,
    label: 'Risco moderado — vale investigar',
    Icon: AlertTriangle,
    tone: 'text-cyan',
    // ⛔ Terminava em "antes de você pagar qualquer coisa" — lê como teste
    // grátis, que acabou em 03/09. O fato do modelo de 04/09 é outro e
    // continua forte: a cobrança começa 45 dias depois da nota fiscal, então
    // as primeiras análises chegam antes da primeira cobrança.
    text: 'Alguns sintomas já apontam distúrbios de alta frequência na sua rede. Com o Master Block instalado, o software identifica a causa e mostra a redução — e as primeiras análises da sua rede chegam antes da primeira cobrança.',
  },
  {
    min: 0,
    label: 'Risco baixo pelos sintomas informados',
    Icon: CheckCircle2,
    tone: 'text-cyan',
    text: 'Os sinais clássicos de VTCD não apareceram — mas distúrbios de alta frequência muitas vezes passam despercebidos até a primeira queima. Se quiser certeza, o software mede o antes e o depois na sua planta — e no 12º mês você tem 60 dias pra decidir se continua.',
  },
];

export function VtcdQuiz() {
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(QUESTIONS.length).fill(null));

  const answered = answers.every((a) => a !== null);
  const score = answers.filter(Boolean).length;
  const level = LEVELS.find((l) => score >= l.min) ?? LEVELS[2];

  return (
    <div className="rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 md:p-8">
      <ol className="space-y-4">
        {QUESTIONS.map((q, i) => (
          <li
            key={q}
            className="flex flex-col gap-2 border-b border-[rgb(var(--border))] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <span className="text-sm leading-relaxed md:text-[15px]">
              <span className="mr-2 font-sans font-bold text-cyan">{i + 1}.</span>
              {q}
            </span>
            <span className="flex shrink-0 gap-2" role="group" aria-label={`Resposta da pergunta ${i + 1}`}>
              {([true, false] as const).map((val) => {
                const selected = answers[i] === val;
                return (
                  <button
                    key={String(val)}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setAnswers((prev) => prev.map((a, j) => (j === i ? val : a)))
                    }
                    className={`rounded-btn border px-4 py-1.5 font-sans text-sm font-semibold transition-colors ${
                      selected
                        ? val
                          ? 'border-gold bg-gold text-white'
                          : 'border-cyan bg-cyan text-white'
                        : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:border-gold hover:text-gold'
                    }`}
                  >
                    {val ? 'Sim' : 'Não'}
                  </button>
                );
              })}
            </span>
          </li>
        ))}
      </ol>

      {answered && (
        <div
          className="mt-6 rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5"
          role="status"
          aria-live="polite"
        >
          <div className={`flex items-center gap-2 font-sans font-bold ${level.tone}`}>
            <level.Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            {level.label} — {score} de {QUESTIONS.length} sintomas
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">{level.text}</p>
          <Link
            href="#calculadora"
            className="mt-3 inline-block font-sans text-sm font-semibold text-gold hover:text-gold-soft transition-colors"
          >
            Calcule abaixo quanto isso custa por ano ↓
          </Link>
        </div>
      )}
    </div>
  );
}
