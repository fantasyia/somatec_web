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
import { trackEvent } from '@/lib/analytics';
import { enviarLeadOrcamento } from '@/lib/forms/enviar-lead-orcamento';
import { WizardShell } from '@/components/tools/wizard/WizardShell';
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

type ContextoId = 'casa' | 'apartamento' | 'comercio' | 'oficina' | 'condominio';
type Contexto = { id: ContextoId; icon: typeof Home; label: string; quadros: string[] };

/** Os quadros adicionais saem do CONTEXTO, não do público: quem marcou
 *  "meu condomínio" não tem câmara fria, e apartamento não tem casa de
 *  máquinas de piscina. Mostrar preset que não existe queima a confiança. */
const CONTEXTOS: Record<Setor, Contexto[]> = {
  residencial: [
    {
      id: 'casa', icon: Home, label: 'Minha casa',
      quadros: ['Casa de máquinas da piscina', 'Automação / home theater', 'Ar-condicionado central', 'Carregador do carro elétrico'],
    },
    {
      id: 'apartamento', icon: Building2, label: 'Meu apartamento',
      quadros: ['Automação / home theater', 'Ar-condicionado', 'Carregador do carro elétrico'],
    },
  ],
  comercial: [
    {
      id: 'comercio', icon: Store, label: 'Meu comércio',
      quadros: ['Câmara fria', 'Freezers / refrigeração', 'PDV / servidores', 'Ar-condicionado'],
    },
    {
      id: 'oficina', icon: Wrench, label: 'Meu pequeno negócio / oficina',
      quadros: ['Máquinas / compressor', 'PDV / servidores', 'Ar-condicionado'],
    },
    {
      id: 'condominio', icon: Building2, label: 'Meu condomínio',
      quadros: ['Elevador', "Bombas d'água", 'Portaria / CFTV', 'Ar-condicionado central'],
    },
  ],
};

const TENSOES = ['127V', '220V', '380V', '440V', 'Não sei'] as const;
const TOTAL_PASSOS = 4;

export function CheckoutNI({ setor, landingSlug, whatsappHref, whatsappExternal = false }: Props) {
  const baseId = useId();
  const startedRef = useRef(false);

  const [passo, setPasso] = useState(1);
  const [contexto, setContexto] = useState<ContextoId | ''>('');
  const [tensao, setTensao] = useState('');
  const [corrente, setCorrente] = useState('');
  const [naoSei, setNaoSei] = useState(false);
  /** Quadros adicionais escolhidos + a corrente de cada um (opcional: sem ela,
   *  o secundário vai "a dimensionar no contato" em vez de já vir com preço). */
  const [adicionais, setAdicionais] = useState<{ nome: string; corrente: string }[]>([]);

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

  /** Contexto escolhido no passo 1 — dita os quadros do passo 3. */
  const ctxAtual = CONTEXTOS[setor].find((c) => c.id === contexto);

  function toggleAdicional(q: string) {
    setAdicionais((prev) =>
      prev.some((a) => a.nome === q) ? prev.filter((a) => a.nome !== q) : [...prev, { nome: q, corrente: '' }],
    );
  }

  function setCorrenteAdicional(nome: string, valor: string) {
    setAdicionais((prev) => prev.map((a) => (a.nome === nome ? { ...a, corrente: valor } : a)));
  }

  /** Carrinho: MB do quadro de entrada + 1 MB por quadro adicional com corrente. */
  const itensCarrinho = [
    ...(modelo ? [{ quadro: 'Quadro de entrada', modelo, principal: true }] : []),
    ...adicionais.map((a) => {
      const amp = parseAmp(a.corrente);
      const m = amp > 0 && amp <= MB_LOAD_MAX ? selecionarMasterBlock(amp) : null;
      return { quadro: a.nome, modelo: m, principal: false };
    }),
  ];
  const totalCarrinho = itensCarrinho.reduce((s, i) => s + (i.modelo?.preco ?? 0), 0);
  const semPreco = itensCarrinho.filter((i) => !i.modelo).length;

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
    const secundarios = itensCarrinho.filter((i) => !i.principal);
    const adic = secundarios.length
      ? 'Quadros adicionais: ' +
        secundarios
          .map((i) => `${i.quadro} → ${i.modelo ? `${i.modelo.model} (${formatBRL(i.modelo.preco)})` : 'sem corrente, a dimensionar'}`)
          .join('; ') +
        `. Total dos itens dimensionados: ${formatBRL(totalCarrinho)}.`
      : 'Sem quadros adicionais indicados.';
    const resumo =
      `[Orçamento ${setor} — compra direta] Contexto: ${ctxAtual?.label ?? '—'}. ` +
      `Quadro de entrada: ${dadosQuadro}. ${dimensionamento} ${adic}`.replace(/\s+/g, ' ').trim();

    const r = await enviarLeadOrcamento({
      nome: fd.get('name'),
      email: fd.get('email'),
      whatsapp: fd.get('whatsapp'),
      empresa: fd.get('company'),
      segmento: `NI · ${setor}`,
      // A LP já define o público — o lead sai roteável sem perguntar de novo.
      publico: setor === 'residencial' ? 'residencia' : 'comercio',
      resumo,
      sourcePage: `/${landingSlug}`,
      lgpdConsent: fd.get('lgpd_consent') === 'on',
      honeypot: fd.get('website'),
      captchaToken,
    });

    if (r.ok) {
      setStatus('success');
      setMessage(
        'Recebido! Nossa equipe dimensiona o seu Master Block e te retorna com o valor — sem compromisso.',
      );
      trackEvent('calc_lead', { setor, landing: landingSlug });
    } else {
      setStatus('error');
      setMessage(r.mensagem);
    }
  }

  const cardBtn =
    'flex items-center gap-3 rounded-card border p-4 text-left font-sans text-sm font-semibold transition-colors';

  return (
    <WizardShell
      passo={passo}
      totalPassos={TOTAL_PASSOS}
      nota="2 minutos · sem vendedor"
      rotuloSucesso="Pronto"
      status={status}
      mensagem={message}
      podeAvancar={podeAvancar()}
      onVoltar={() => irPara(passo - 1)}
      onContinuar={() => irPara(passo + 1)}
    >
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
                  {CONTEXTOS[setor].map(({ id, icon: Icon, label }) => {
                    const sel = contexto === id;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setContexto(id);
                          setAdicionais([]); // trocar de contexto invalida os quadros
                        }}
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
                    menor em cada quadro específico.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(ctxAtual?.quadros ?? []).map((q) => {
                    const escolhido = adicionais.find((a) => a.nome === q);
                    const sel = escolhido !== undefined;
                    return (
                      <div
                        key={q}
                        className={`rounded-card border transition-colors ${
                          sel ? 'border-gold bg-gold/[0.06]' : 'border-[rgb(var(--border))]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleAdicional(q)}
                          className="flex w-full items-center gap-3 p-4 text-left font-sans text-sm font-semibold text-[rgb(var(--text))]"
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
                        {/* Corrente do quadro adicional → dá o MB secundário e o
                            preço dele. Em branco = dimensionado no contato. */}
                        {sel && (
                          <div className="px-4 pb-4">
                            <label
                              htmlFor={`${baseId}-adic-${q}`}
                              className="block pb-1.5 text-xs font-sans font-semibold text-[rgb(var(--text-muted))]"
                            >
                              Corrente do disjuntor deste quadro (A) — opcional
                            </label>
                            <input
                              id={`${baseId}-adic-${q}`}
                              type="text"
                              inputMode="numeric"
                              placeholder="Ex.: 25, 40…"
                              value={escolhido.corrente}
                              onChange={(e) => setCorrenteAdicional(q, e.target.value)}
                              className="w-full rounded-btn border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-2 font-sans text-sm outline-none transition-colors focus:border-gold"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Passo 4 — Resultado (dimensionado c/ preço · fallback p/ "não sei") + captura ── */}
            {passo === 4 && (
              <div className="space-y-5">
                {/* Card de resultado dimensionado — quando a corrente é conhecida */}
                {temPreco && (
                  <div className="rounded-card-lg bg-deep_navy p-6 text-white md:p-7">
                    <div className="text-[11px] font-sans font-bold text-white/60">
                      Sua proteção em cascata
                    </div>
                    <ul className="mt-3 divide-y divide-white/10">
                      {itensCarrinho.map((item) => (
                        <li key={item.quadro} className="flex items-baseline justify-between gap-4 py-2.5">
                          <span className="text-sm">
                            <span className="font-semibold text-white">
                              {item.modelo ? item.modelo.model : 'A dimensionar'}
                            </span>
                            <span className="ml-2 text-white/60">{item.quadro}</span>
                          </span>
                          <span className="shrink-0 text-sm tabular-nums text-white/80">
                            {item.modelo ? formatBRL(item.modelo.preco) : 'no contato'}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 border-t border-white/10 pt-4">
                      <span className="text-sm text-white/60">
                        {semPreco > 0 ? 'Subtotal (itens dimensionados)' : 'Total · compra direta'}
                      </span>
                      <span className="font-serif text-3xl font-bold text-gold">{formatBRL(totalCarrinho)}</span>
                    </div>
                    {semPreco > 0 && (
                      <p className="mt-3 text-sm text-white/75">
                        {semPreco === 1 ? 'Um quadro ficou' : `${semPreco} quadros ficaram`} sem a
                        corrente — a equipe dimensiona e inclui no orçamento.
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

      </>
    </WizardShell>
  );
}
