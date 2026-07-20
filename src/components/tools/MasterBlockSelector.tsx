'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ChevronRight, Loader2, Cpu, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { TextField } from '@/components/forms/fields/TextField';
import { HoneypotField } from '@/components/forms/fields/HoneypotField';
import { TurnstileWidget } from '@/components/forms/fields/TurnstileWidget';
import { FormStatus, type FormStatusKind } from '@/components/forms/fields/FormStatus';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';
import {
  selecionarMasterBlock,
  formatBRL,
  MB_TENSAO,
  MB_LOAD_MAX,
} from '@/lib/constants/masterblock';

// =============================================================================
// Seletor "Qual Master Block é o meu?" — o visitante informa a corrente de
// carga do circuito (A) e vê, na hora, o modelo recomendado (Tabela de
// Potências 2026). A captura envia o lead pro Betinna via /api/forms/submit
// (form_type 'b2b'), com a seleção na mensagem. Dimensionamento indicativo —
// o projeto final é sempre validado pela engenharia (proteção em cascata).
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
  'Comércio / Residência',
  'Outro',
] as const;

// Aceita "1250", "1.250", "1250 A" — retorna número ou 0.
function parseAmp(s: string): number {
  const n = parseFloat(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

type Props = {
  /** source_page enviado no lead (distingue seletor vs orçamento no Betinna). */
  sourcePage?: string;
  /** Texto do botão de envio (orçamento usa um CTA de venda). */
  ctaLabel?: string;
};

export function MasterBlockSelector({
  sourcePage = '/ferramentas/qual-master-block',
  ctaLabel = 'Receber o dimensionamento',
}: Props = {}) {
  const [corrente, setCorrente] = useState('');
  const [segment, setSegment] = useState('');

  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');

  const amp = useMemo(() => parseAmp(corrente), [corrente]);
  const model = useMemo(() => selecionarMasterBlock(amp), [amp]);
  const hasInput = amp > 0;
  const overRange = hasInput && amp > MB_LOAD_MAX;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    const selecao = model
      ? `modelo recomendado ${model.model} (${model.loadLabel}, surto ${model.surge}) — preço de venda ${formatBRL(model.preco)}`
      : `acima da linha padrão (> ${MB_LOAD_MAX} A) — requer solução dedicada`;
    const resumo =
      `[Seletor Master Block] Corrente de carga informada: ${amp} A → ${selecao}. ` +
      `Tensão da linha: ${MB_TENSAO}.`;

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
          segment,
          message: resumo,
          lgpd_consent: fd.get('lgpd_consent') === 'on',
          source_page: sourcePage,
          website: fd.get('website') ?? '',
          captcha_token: captchaToken,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      if (res.ok && data.ok) {
        setStatus('success');
        setMessage(
          'Recebido! Nossa engenharia vai confirmar o dimensionamento do seu projeto de proteção em cascata e falar com você pelo WhatsApp.',
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
      id="seletor"
      className="scroll-mt-28 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 md:p-8"
    >
      {/* Input */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Corrente de carga do circuito (A)"
          name="corrente"
          inputMode="decimal"
          placeholder="Ex.: 1250"
          value={corrente}
          onChange={(e) => setCorrente(e.target.value)}
          required
        />
        <div className="flex items-end">
          <p className="text-xs leading-relaxed text-[rgb(var(--text-muted))]">
            É a corrente nominal do circuito a proteger (disjuntor / barramento). Toda a linha
            Master Block opera de <span className="font-semibold text-[rgb(var(--text))]">{MB_TENSAO}</span>.
          </p>
        </div>
      </div>

      {/* Resultado */}
      {hasInput && (
        <div
          className="mt-8 rounded-card-lg bg-deep_navy p-6 text-white md:p-8"
          role="status"
          aria-live="polite"
        >
          {model ? (
            <>
              <div className="text-[11px] font-sans font-bold text-white/60">
                Modelo indicado para {amp} A
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-btn bg-gold/15 text-gold">
                  <Cpu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="font-serif text-4xl font-bold text-gold md:text-5xl">
                  {model.model}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm text-white/75">
                <span>Faixa de corrente: {model.loadLabel}</span>
                <span>Máx. surto (8/20 µs): {model.surge}</span>
                <span>Tensão: {MB_TENSAO}</span>
              </div>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-white/10 pt-4">
                <span className="text-sm text-white/60">Preço de venda do equipamento</span>
                <span className="font-serif text-3xl font-bold text-gold">{formatBRL(model.preco)}</span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
                Indicação pela corrente de carga. O projeto final é dimensionado pela engenharia
                em <span className="font-semibold text-white">proteção em cascata</span> (entrada,
                quadro e equipamento crítico) + aterramento dedicado. Deixe seus dados que a Somatec
                confirma o modelo e fecha a compra com você.
              </p>
            </>
          ) : (
            <>
              <div className="text-[11px] font-sans font-bold text-white/60">
                Acima da linha padrão
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-btn bg-gold/15 text-gold">
                  <PhoneCall className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="font-serif text-2xl font-bold text-white md:text-3xl">
                  Solução dedicada
                </span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
                {amp} A ultrapassa a faixa do maior modelo padrão (MB-12, até {MB_LOAD_MAX} A). Para
                instalações desse porte a Somatec projeta uma solução sob medida — deixe seus dados
                que a engenharia fala com você.
              </p>
            </>
          )}
        </div>
      )}

      {/* Captura */}
      {hasInput && status !== 'success' && (
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
              htmlFor="sel-segment"
              className="block text-xs font-sans font-semibold text-[rgb(var(--text-muted))]"
            >
              Segmento
            </label>
            <select
              id="sel-segment"
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
                {ctaLabel}
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
