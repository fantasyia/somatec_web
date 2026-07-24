'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { TextField } from '@/components/forms/fields/TextField';
import { HoneypotField } from '@/components/forms/fields/HoneypotField';
import { TurnstileWidget } from '@/components/forms/fields/TurnstileWidget';
import { FormStatus, type FormStatusKind } from '@/components/forms/fields/FormStatus';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';
import { getAtribuicao } from '@/lib/attribution';

// =============================================================================
// Calculadora de custo de parada (lead magnet) — o visitante informa 2-4
// números e vê o prejuízo anual estimado; a captura envia o lead pro Betinna
// via /api/forms/submit (form_type 'b2b' — funil de clientes), com o cálculo
// e o segmento na mensagem.
// =============================================================================

const SEGMENTS = [
  'Alimentícia',
  'Autopeças',
  'Metalúrgica / Siderúrgica',
  'Têxtil',
  'Farmacêutica',
  'Plástico / Injeção',
  'Papel / Papelão',
  'Mineração',
  'Varejo / CD',
  'Outro',
] as const;

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

// Aceita "1.500", "1500,50", "R$ 1.500" — retorna número ou 0.
function parseBrl(s: string): number {
  const n = parseFloat(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function CostCalculator() {
  const [custoHora, setCustoHora] = useState('');
  const [horasMes, setHorasMes] = useState('');
  const [queimasAno, setQueimasAno] = useState('');
  const [custoEquip, setCustoEquip] = useState('');
  const [segment, setSegment] = useState('');
  const [segmentOutro, setSegmentOutro] = useState('');

  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');

  const calc = useMemo(() => {
    const paradasAno = parseBrl(custoHora) * parseBrl(horasMes) * 12;
    const queimas = parseBrl(queimasAno) * parseBrl(custoEquip);
    return { paradasAno, queimas, total: paradasAno + queimas };
  }, [custoHora, horasMes, queimasAno, custoEquip]);

  const hasResult = calc.total > 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    const resumo =
      `[Calculadora de custo de parada] Prejuízo anual estimado: ${brl(calc.total)} ` +
      `(paradas: ${brl(calc.paradasAno)} · queimas: ${brl(calc.queimas)}). ` +
      `Inputs: R$/h parada=${custoHora || '-'}, h/mês=${horasMes || '-'}, ` +
      `queimas/ano=${queimasAno || '-'}, custo médio equip.=${custoEquip || '-'}.`;

    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'b2b',
          interest_type: 'b2b',
          name: fd.get('name'),
          email: fd.get('email'),
          whatsapp: fd.get('whatsapp'),
          company: fd.get('company') ?? '',
          segment: segment === 'Outro' && segmentOutro.trim() ? segmentOutro.trim() : segment,
          message: resumo,
          lgpd_consent: fd.get('lgpd_consent') === 'on',
          source_page: '/ferramentas/custo-de-parada',
          website: fd.get('website') ?? '',
          captcha_token: captchaToken,
          formulario: 'calculadora',
          ...(getAtribuicao() ? { atribuicao: getAtribuicao() } : {}),
        }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      if (res.ok && data.ok) {
        setStatus('success');
        setMessage(
          'Recebido! Nossa engenharia vai analisar seus números e falar com você pelo WhatsApp — a medição na sua planta é sem custo.',
        );
      } else {
        setStatus('error');
        setMessage(data.message ?? 'Não foi possível enviar agora. Tente novamente.');
      }
    } catch {
      setStatus('error');
      setMessage('Não foi possível enviar agora. Tente novamente em instantes.');
    }
  }

  return (
    <div
      id="calculadora"
      className="scroll-mt-28 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 md:p-8"
    >
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Custo de 1 hora de produção parada (R$)"
          name="custo_hora"
          inputMode="decimal"
          placeholder="Ex.: 8.000"
          value={custoHora}
          onChange={(e) => setCustoHora(e.target.value)}
          required
        />
        <TextField
          label="Horas de parada por mês"
          name="horas_mes"
          inputMode="decimal"
          placeholder="Ex.: 6"
          value={horasMes}
          onChange={(e) => setHorasMes(e.target.value)}
          required
        />
        <TextField
          label="Equipamentos queimados por ano (opcional)"
          name="queimas_ano"
          inputMode="decimal"
          placeholder="Ex.: 12"
          value={queimasAno}
          onChange={(e) => setQueimasAno(e.target.value)}
        />
        <TextField
          label="Custo médio por equipamento queimado (R$, opcional)"
          name="custo_equip"
          inputMode="decimal"
          placeholder="Ex.: 4.500"
          value={custoEquip}
          onChange={(e) => setCustoEquip(e.target.value)}
        />
      </div>

      {/* Resultado */}
      {hasResult && (
        <div
          className="mt-8 rounded-card-lg bg-deep_navy texture-dark p-6 text-white md:p-8"
          role="status"
          aria-live="polite"
        >
          <div className="text-[11px] font-sans font-bold text-white/60">
            Prejuízo anual estimado da sua operação
          </div>
          <div className="mt-2 font-serif text-4xl font-bold text-gold md:text-5xl">
            {brl(calc.total)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm text-white/75">
            {calc.paradasAno > 0 && <span>Paradas de produção: {brl(calc.paradasAno)}/ano</span>}
            {calc.queimas > 0 && <span>Queima de equipamentos: {brl(calc.queimas)}/ano</span>}
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
            É esse número que o Master Block ataca — e, no modelo da Somatec,{' '}
            <span className="font-semibold text-white">
              você só paga se o resultado for comprovado na sua própria planta
            </span>
            . Deixe seus dados e receba a análise da engenharia com a medição sem custo.
          </p>
        </div>
      )}

      {/* Captura */}
      {hasResult && status !== 'success' && (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Seu nome" name="name" autoComplete="name" required />
            <TextField label="Empresa" name="company" autoComplete="organization" />
            <TextField label="E-mail corporativo" name="email" type="email" autoComplete="email" required />
            <TextField
              label="WhatsApp"
              name="whatsapp"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="calc-segment"
              className="block text-xs font-sans font-semibold text-[rgb(var(--text-muted))]"
            >
              Segmento
            </label>
            <select
              id="calc-segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full rounded-btn border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-2.5 font-sans text-sm outline-none transition-colors focus:border-gold"
            >
              <option value="">Selecione…</option>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {/* "Outro" abre campo livre — o texto digitado vira o segmento do lead. */}
            {segment === 'Outro' && (
              <div className="pt-1.5">
                <label
                  htmlFor="calc-segment-outro"
                  className="block pb-1.5 text-xs font-sans font-semibold text-[rgb(var(--text-muted))]"
                >
                  Qual é o seu segmento?
                </label>
                <input
                  id="calc-segment-outro"
                  type="text"
                  value={segmentOutro}
                  onChange={(e) => setSegmentOutro(e.target.value)}
                  maxLength={160}
                  required
                  placeholder="Ex.: gráfica, frigorífico, data center…"
                  className="w-full rounded-btn border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-2.5 font-sans text-sm outline-none transition-colors focus:border-gold"
                />
              </div>
            )}
          </div>

          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
            <input type="checkbox" name="lgpd_consent" required className="mt-0.5 accent-[#F39200]" />
            <span>
              {LGPD_PUBLIC_DEFAULT.text}{' '}
              <Link href="/politica-de-privacidade" className="underline hover:text-gold">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          <HoneypotField />
          <TurnstileWidget onToken={setCaptchaToken} />

          {status === 'error' && <FormStatus status="error" message={message} />}

          <button type="submit" disabled={status === 'submitting'} className="btn-primary group">
            {status === 'submitting' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                Receber a análise sem custo
                <ChevronRight
                  className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </>
            )}
          </button>
        </form>
      )}

      {status === 'success' && (
        <div className="mt-6">
          <FormStatus status="success" message={message} />
        </div>
      )}
    </div>
  );
}
