'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Home,
  Building2,
  Store,
  Wrench,
  Camera,
} from 'lucide-react';
import { TextField } from '@/components/forms/fields/TextField';
import { HoneypotField } from '@/components/forms/fields/HoneypotField';
import { TurnstileWidget } from '@/components/forms/fields/TurnstileWidget';
import { FormStatus, type FormStatusKind } from '@/components/forms/fields/FormStatus';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';
import { getAtribuicao } from '@/lib/attribution';
import { trackEvent } from '@/lib/analytics';
import { selecionarMasterBlock, formatBRL, MB_LOAD_MAX } from '@/lib/constants/masterblock';

// Aceita "40", "63 A", "1.250" → número ou 0.
function parseAmp(s: string): number {
  const n = parseFloat(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// =============================================================================
// CheckoutNI — wizard de auto-orçamento para clientes NÃO industriais (leigos).
// Componente ÚNICO, reutilizado nas LPs residencial e comercial (muda `setor` +
// presets). Spec: checkout-ni-spec.md + lp-ni-spec.md.
//
// MODO FALLBACK (ativo até a tabela de dimensionamento do Leandro): o wizard
// coleta o contexto e o quadro, mas NÃO precifica no front — o desfecho é
// "solicitar orçamento" → lead no Betinna (via /api/forms/submit). Quando a
// tabela chegar, o passo de resultado passa a dimensionar/precificar (o resto
// da jornada não muda).
//
// 🔒 REGRA DE OURO (Leandro): esta é a trilha de COMPRA DIRETA. Nada de
// locação, comodato ou "paga só com resultado" — essa oferta é exclusiva da
// trilha industrial. "Não sei" nunca trava: sempre há foto/WhatsApp.
// =============================================================================

type Setor = 'residencial' | 'comercial';

type Props = {
  setor: Setor;
  /** Slug da LP — vai em source_page do lead e nos eventos. */
  landingSlug: string;
  /** Link de WhatsApp (montado no server) para o escape "não sei". */
  whatsappHref: string;
  whatsappExternal?: boolean;
};

const CONTEXTOS: Record<Setor, { icon: typeof Home; label: string }[]> = {
  residencial: [
    { icon: Home, label: 'Minha casa' },
    { icon: Building2, label: 'Meu apartamento' },
  ],
  comercial: [
    { icon: Store, label: 'Meu comércio' },
    { icon: Wrench, label: 'Meu pequeno negócio / oficina' },
    { icon: Building2, label: 'Meu condomínio' },
  ],
};

const QUADROS_ADICIONAIS: Record<Setor, string[]> = {
  residencial: [
    'Casa de máquinas da piscina',
    'Automação / home theater',
    'Ar-condicionado central',
    'Carregador do carro elétrico',
  ],
  comercial: [
    'Câmara fria',
    'Freezers / refrigeração',
    'PDV / servidores',
    'Ar-condicionado',
    'Elevador (condomínio)',
  ],
};

const TENSOES = ['127V', '220V', '380V', '440V', 'Não sei'] as const;
const TOTAL_PASSOS = 4;

export function CheckoutNI({ setor, landingSlug, whatsappHref, whatsappExternal = false }: Props) {
  const baseId = useId();
  const startedRef = useRef(false);

  const [passo, setPasso] = useState(1);
  const [contexto, setContexto] = useState('');
  const [tensao, setTensao] = useState('');
  const [corrente, setCorrente] = useState('');
  const [naoSei, setNaoSei] = useState(false);
  const [adicionais, setAdicionais] = useState<string[]>([]);

  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');

  // Dimensionamento LIVE (Tabela de Potências 2026 + preço de venda direta): a
  // corrente do quadro de entrada → modelo MB + preço. Fallback só quando o
  // cliente não sabe os dados (naoSei) ou está acima da linha padrão.
  const amp = parseAmp(corrente);
  const modelo = !naoSei && amp > 0 && amp <= MB_LOAD_MAX ? selecionarMasterBlock(amp) : null;
  const overRange = !naoSei && amp > MB_LOAD_MAX;
  const temPreco = modelo != null;

  // Emite calc_inicio na 1ª interação e calc_passo a cada avanço.
  function irPara(n: number) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent('calc_inicio', { setor, landing: landingSlug });
    }
    const alvo = Math.min(TOTAL_PASSOS, Math.max(1, n));
    setPasso(alvo);
    trackEvent('calc_passo', { setor, landing: landingSlug, passo: alvo });
    if (alvo === TOTAL_PASSOS) {
      trackEvent('calc_resultado', {
        setor,
        landing: landingSlug,
        temPreco,
        modelo: modelo?.model ?? (overRange ? 'acima-da-linha' : 'nao-sei'),
      });
    }
  }

  function toggleAdicional(q: string) {
    setAdicionais((prev) => (prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]));
  }

  function podeAvancar(): boolean {
    if (passo === 1) return contexto !== '';
    if (passo === 2) return naoSei || (tensao !== '' && corrente.trim() !== '');
    return true; // passo 3 (adicionais) é opcional
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    const dadosQuadro = naoSei
      ? 'não sabe os dados do quadro (pediu dimensionamento pela equipe — foto/WhatsApp)'
      : `tensão ${tensao || 'não informada'}, corrente do disjuntor geral ${corrente.trim() || 'não informada'}`;
    const dimensionamento = modelo
      ? `Dimensionado (quadro de entrada): ${modelo.model} (${modelo.loadLabel}) — ${formatBRL(modelo.preco)}.`
      : overRange
        ? `Acima da linha padrão (> ${MB_LOAD_MAX} A) — requer dimensionamento dedicado.`
        : '';
    const adic = adicionais.length
      ? `Quadros adicionais a proteger (1 MB secundário cada, dimensionado no contato): ${adicionais.join(', ')}.`
      : 'Sem quadros adicionais indicados.';
    const resumo =
      `[Orçamento ${setor} — compra direta] Contexto: ${contexto}. ` +
      `Quadro de entrada: ${dadosQuadro}. ${dimensionamento} ${adic}`.replace(/\s+/g, ' ').trim();

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
          segment: `NI · ${setor}`,
          message: resumo,
          lgpd_consent: fd.get('lgpd_consent') === 'on',
          source_page: `/${landingSlug}`,
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
          'Recebido! Nossa equipe dimensiona o seu Master Block e te retorna com o valor — sem compromisso.',
        );
        trackEvent('calc_lead', { setor, landing: landingSlug });
      } else {
        setStatus('error');
        setMessage(data.message ?? 'Não foi possível enviar agora. Tente novamente.');
      }
    } catch {
      setStatus('error');
      setMessage('Não foi possível enviar agora. Tente novamente em instantes.');
    }
  }

  const cardBtn =
    'flex items-center gap-3 rounded-card border p-4 text-left font-sans text-sm font-semibold transition-colors';

  return (
    <div
      id="calculadora"
      className="scroll-mt-28 overflow-hidden rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
    >
      {/* Barra de progresso */}
      <div className="border-b border-[rgb(var(--border))] px-6 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold text-[rgb(var(--text-muted))]">
            {status === 'success' ? 'Pronto' : `Passo ${passo} de ${TOTAL_PASSOS}`}
          </span>
          <span className="font-sans text-xs text-[rgb(var(--text-muted))]">
            2 minutos · sem vendedor
          </span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[rgb(var(--border))]">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-300 ease-premium"
            style={{ width: `${(status === 'success' ? TOTAL_PASSOS : passo) / TOTAL_PASSOS * 100}%` }}
          />
        </div>
      </div>

      <div className="p-6 md:p-8">
        {status === 'success' ? (
          <FormStatus status="success" message={message} />
        ) : (
          <>
            {/* ── Passo 1 — Contexto ─────────────────────────────── */}
            {passo === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    O que você quer proteger?
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    É só pra ajustar os exemplos — leva 2 minutos e você não precisa entender de
                    elétrica.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CONTEXTOS[setor].map(({ icon: Icon, label }) => {
                    const sel = contexto === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setContexto(label)}
                        className={`${cardBtn} ${
                          sel
                            ? 'border-gold bg-gold/[0.06] text-[rgb(var(--text))]'
                            : 'border-[rgb(var(--border))] text-[rgb(var(--text))] hover:border-gold/50'
                        }`}
                      >
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn ${
                            sel ? 'bg-gold/15 text-gold' : 'bg-cyan/10 text-cyan'
                          }`}
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Passo 2 — Quadro de entrada ────────────────────── */}
            {passo === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    Vamos ao seu quadro de energia principal.
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Não sabe? Toca em &ldquo;não sei&rdquo; e seguimos com uma foto do quadro.
                    Ninguém trava aqui.
                  </p>
                </div>

                {!naoSei && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`${baseId}-tensao`}
                        className="block text-xs font-sans font-semibold text-[rgb(var(--text-muted))]"
                      >
                        Tensão
                      </label>
                      <select
                        id={`${baseId}-tensao`}
                        value={tensao}
                        onChange={(e) => setTensao(e.target.value)}
                        className="w-full rounded-btn border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-2.5 font-sans text-sm outline-none transition-colors focus:border-gold"
                      >
                        <option value="">Selecione…</option>
                        {TENSOES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        Geralmente 127V ou 220V em casas e comércios.
                      </p>
                    </div>
                    <TextField
                      label="Corrente do disjuntor geral (A)"
                      name="corrente"
                      inputMode="numeric"
                      placeholder="Ex.: 40, 63, 100…"
                      value={corrente}
                      onChange={(e) => setCorrente(e.target.value)}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setNaoSei((v) => !v)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:text-gold"
                >
                  <Camera className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  {naoSei ? 'Sei os dados do meu quadro' : 'Não sei meus dados'}
                </button>

                {naoSei && (
                  <div className="rounded-card border border-cyan/25 bg-cyan/[0.05] p-4 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                    Sem problema. Você segue o pedido e nossa equipe dimensiona pela{' '}
                    <span className="font-semibold text-[rgb(var(--text))]">foto do seu quadro</span>{' '}
                    — dá pra mandar do celular ao falar com a gente. Prefere já conversar?{' '}
                    {whatsappExternal ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gold underline"
                      >
                        Falar no WhatsApp
                      </a>
                    ) : (
                      <Link href={whatsappHref} className="font-semibold text-gold underline">
                        Falar no WhatsApp
                      </Link>
                    )}
                    .
                  </div>
                )}
              </div>
            )}

            {/* ── Passo 3 — Quadros adicionais ───────────────────── */}
            {passo === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    Tem algum quadro separado que também quer proteger?
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Assim você protege tudo em cascata: um Master Block mais robusto na entrada + um
                    menor em cada quadro específico. (Opcional.)
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {QUADROS_ADICIONAIS[setor].map((q) => {
                    const sel = adicionais.includes(q);
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => toggleAdicional(q)}
                        className={`${cardBtn} ${
                          sel
                            ? 'border-gold bg-gold/[0.06]'
                            : 'border-[rgb(var(--border))] hover:border-gold/50'
                        } text-[rgb(var(--text))]`}
                        aria-pressed={sel}
                      >
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            sel ? 'border-gold bg-gold text-white' : 'border-[rgb(var(--border))]'
                          }`}
                        >
                          {sel && <ChevronRight className="h-3.5 w-3.5 rotate-90" strokeWidth={3} />}
                        </span>
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Passo 4 — Resultado (dimensionado c/ preço · fallback p/ "não sei") + captura ── */}
            {passo === 4 && (
              <div className="space-y-5">
                {/* Card de resultado dimensionado — quando a corrente é conhecida */}
                {temPreco && modelo && (
                  <div className="rounded-card-lg bg-deep_navy p-6 text-white md:p-7">
                    <div className="text-[11px] font-sans font-bold text-white/60">
                      Recomendado para o seu quadro de entrada
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-serif text-4xl font-bold text-gold">{modelo.model}</span>
                      <span className="text-sm text-white/70">{modelo.loadLabel}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-baseline gap-x-3 border-t border-white/10 pt-4">
                      <span className="text-sm text-white/60">Compra direta do equipamento</span>
                      <span className="font-serif text-3xl font-bold text-gold">{formatBRL(modelo.preco)}</span>
                    </div>
                    {adicionais.length > 0 && (
                      <p className="mt-3 text-sm text-white/75">
                        + 1 Master Block menor por quadro adicional ({adicionais.length}) — dimensionado
                        no contato, pra proteger tudo em cascata.
                      </p>
                    )}
                    <p className="mt-3 text-xs leading-relaxed text-white/60">
                      Protege seus equipamentos contra os picos de tensão que o DPS e o no-break não
                      pegam. Indicação pela corrente informada; a engenharia confirma o projeto final.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    {temPreco ? 'Falta só um passo pra fechar.' : 'Falta só um passo pro seu orçamento.'}
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    {temPreco
                      ? 'Deixe seus dados que a Somatec confirma o modelo e fecha a compra com você — sem vendedor no seu pé.'
                      : overRange
                        ? 'Seu quadro está acima da linha padrão — nossa equipe dimensiona a solução certa e te retorna com o valor.'
                        : 'Nossa equipe dimensiona o Master Block certo pro seu quadro e te retorna com o valor — sem compromisso, sem vendedor no seu pé.'}
                  </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Seu nome" name="name" autoComplete="name" required />
                    <TextField
                      label="WhatsApp"
                      name="whatsapp"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(11) 99999-9999"
                      required
                    />
                    <TextField
                      label="E-mail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                    />
                    <TextField
                      label={setor === 'comercial' ? 'Empresa (opcional)' : 'Cidade (opcional)'}
                      name="company"
                      autoComplete={setor === 'comercial' ? 'organization' : 'address-level2'}
                    />
                  </div>

                  <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
                    <input
                      type="checkbox"
                      name="lgpd_consent"
                      required
                      className="mt-0.5 accent-[#F39200]"
                    />
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

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="btn-primary group w-full justify-center sm:w-auto"
                  >
                    {status === 'submitting' ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        {temPreco ? 'Fechar meu pedido' : 'Solicitar meu orçamento'}
                        <ChevronRight
                          className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                          strokeWidth={2}
                        />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── Navegação ──────────────────────────────────────── */}
            {passo < TOTAL_PASSOS && (
              <div className="mt-8 flex items-center justify-between">
                {passo > 1 ? (
                  <button
                    type="button"
                    onClick={() => irPara(passo - 1)}
                    className="inline-flex items-center gap-1.5 rounded-btn border border-[rgb(var(--border))] px-4 py-2 font-sans text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:border-gold hover:text-gold"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    Voltar
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => irPara(passo + 1)}
                  disabled={!podeAvancar()}
                  className="btn-primary group disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar
                  <ChevronRight
                    className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </button>
              </div>
            )}

            {passo === TOTAL_PASSOS && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => irPara(passo - 1)}
                  className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-gold"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Voltar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
