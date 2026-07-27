'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Minus,
  X,
  Factory,
  Home,
  HelpCircle,
  Cpu,
  Gauge,
  Droplets,
  Zap,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { TextField } from '@/components/forms/fields/TextField';
import { HoneypotField } from '@/components/forms/fields/HoneypotField';
import { TurnstileWidget } from '@/components/forms/fields/TurnstileWidget';
import { FormStatus, type FormStatusKind } from '@/components/forms/fields/FormStatus';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';
import { getAtribuicao } from '@/lib/attribution';
import { trackEvent } from '@/lib/analytics';
import { formatBRL } from '@/lib/constants/masterblock';
import { dimensionarLocacao, VALORES_SIMULADOS } from '@/lib/constants/locacao';

// =============================================================================
// OrcamentoIndustrial — auto-orçamento da TRILHA INDUSTRIAL (final = LOCAÇÃO).
// O cliente remonta a árvore da própria planta (o "projeto mastigado") e sai
// com a noção do projeto de proteção em cascata + lead pro representante.
// Spec: calculadora-industrial-estrutura.md + ferramentas-interativas-spec.md §2.
//
// TRIAGEM (decisão Léo 2026-07-27): corte industrial×NI = GRUPO TARIFÁRIO A.
// Grupo A (≥2,3 kV, média/alta tensão) = industrial (locação). Grupo B (baixa
// tensão) = NI (compra direta) → mandamos pra LP comercial, sem fricção.
//
// MODO FALLBACK (2 pendências do Léo): sem a tabela de preços de LOCAÇÃO e sem
// a regra de dimensionamento tipo→qtd MB, o resultado NÃO crava nº/preço de MB:
// monta o projeto, mostra a cascata e captura o lead → rep confirma técnico e
// retorna em ≤3h úteis (SLA anunciado). Quando os ativos chegarem, o passo de
// resultado passa a dimensionar + precificar.
// =============================================================================

type Grupo = '' | 'A' | 'B' | 'naosei';

const TENSOES_ENTRADA = ['69 kV', '34,5 kV', '13,8 kV', '380 V', 'Outra', 'Não sei'] as const;

type PontoTipo = { key: string; Icon: typeof Cpu; label: string; ajuda: string };
const PONTOS: PontoTipo[] = [
  { key: 'servomotores', Icon: Cpu, label: 'Servomotores', ajuda: 'motores de robôs e eixos' },
  { key: 'servodrivers', Icon: Gauge, label: 'Servodrivers', ajuda: 'os acionamentos dos servos' },
  { key: 'servobombas', Icon: Droplets, label: 'Servobombas', ajuda: 'bombas de injetoras/prensas' },
  { key: 'inversores', Icon: Zap, label: 'Inversores', ajuda: 'inversores de frequência' },
];

const TOTAL_PASSOS = 5; // 1 Grupo · 2 Entrada · 3 Planta · 4 Pontos · 5 Contato

type Props = {
  landingSlug?: string;
  whatsappHref: string;
  whatsappExternal?: boolean;
};

export function OrcamentoIndustrial({
  landingSlug = 'orcamento-industrial',
  whatsappHref,
  whatsappExternal = false,
}: Props) {
  const baseId = useId();
  const startedRef = useRef(false);

  const [passo, setPasso] = useState(1);
  const [grupo, setGrupo] = useState<Grupo>('');
  const [concessionaria, setConcessionaria] = useState('');
  const [tensaoEntrada, setTensaoEntrada] = useState('');
  const [setores, setSetores] = useState<string[]>(['']);
  const [nPaineis, setNPaineis] = useState(1);
  const [pontos, setPontos] = useState<Record<string, number>>({
    servomotores: 0,
    servodrivers: 0,
    servobombas: 0,
    inversores: 0,
  });

  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const setoresValidos = setores.map((s) => s.trim()).filter(Boolean);
  const totalPontos = Object.values(pontos).reduce((a, b) => a + b, 0);
  /** Projeto em cascata (nº de MB por camada + custo). Config: locacao.ts. */
  const projeto = dimensionarLocacao({ paineis: nPaineis, pontosSensiveis: totalPontos });

  function irPara(n: number) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent('calc_ind_inicio', { landing: landingSlug });
    }
    const alvo = Math.min(TOTAL_PASSOS, Math.max(1, n));
    setPasso(alvo);
    trackEvent('calc_ind_passo', { landing: landingSlug, passo: alvo });
    if (alvo === TOTAL_PASSOS) trackEvent('calc_ind_resultado', { landing: landingSlug, setores: setoresValidos.length, pontos: totalPontos });
  }

  async function baixarPdf() {
    setGerandoPdf(true);
    try {
      const { gerarPdfProjeto } = await import('@/lib/pdf/projeto-industrial');
      await gerarPdfProjeto({
        concessionaria: concessionaria.trim(),
        tensaoEntrada,
        setores: setoresValidos,
        paineis: nPaineis,
        pontos: PONTOS.filter((p) => (pontos[p.key] ?? 0) > 0).map((p) => ({
          label: p.label,
          qtd: pontos[p.key],
        })),
        projeto,
        simulado: VALORES_SIMULADOS,
        emitidoEm: new Date().toLocaleDateString('pt-BR'),
      });
      trackEvent('calc_ind_pdf', { landing: landingSlug, mbs: projeto.totalMB });
    } finally {
      setGerandoPdf(false);
    }
  }

  function podeAvancar(): boolean {
    if (passo === 1) return grupo === 'A' || grupo === 'naosei'; // B sai por outro caminho
    if (passo === 2) return tensaoEntrada !== '';
    if (passo === 3) return setoresValidos.length > 0;
    return true; // passo 4 (pontos) pode seguir mesmo em 0 (fallback foto/contato)
  }

  function setPonto(key: string, delta: number) {
    setPontos((p) => ({ ...p, [key]: Math.max(0, (p[key] ?? 0) + delta) }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    const pontosResumo = PONTOS.filter((p) => (pontos[p.key] ?? 0) > 0)
      .map((p) => `${pontos[p.key]} ${p.label.toLowerCase()}`)
      .join(', ') || 'não informado no wizard';
    const resumo =
      `[Orçamento industrial — locação] Grupo tarifário: ${grupo === 'A' ? 'A (média/alta tensão)' : 'não sabe'}. ` +
      `Entrada: ${concessionaria.trim() || 'concessionária não informada'}, tensão ${tensaoEntrada}. ` +
      `Setores/galpões (${setoresValidos.length}): ${setoresValidos.join(', ') || '—'}. ` +
      `Painéis de distribuição: ${nPaineis}. Pontos sensíveis: ${pontosResumo}.`;

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
          segment: 'Industrial · locação',
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
          'Recebido! Um representante da Somatec confirma o projeto de proteção em cascata e retorna em até 3 horas úteis.',
        );
        trackEvent('calc_ind_lead', { landing: landingSlug });
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
    'flex items-start gap-3 rounded-card border p-4 text-left font-sans text-sm transition-colors';

  // ── Grupo B → sai da trilha industrial (compra direta é o caminho) ──────────
  if (grupo === 'B') {
    return (
      <div className="scroll-mt-28 rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 md:p-8">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-cyan/15 text-cyan">
            <Home className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="space-y-3">
            <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
              Pra você, a compra direta é o caminho mais econômico.
            </h3>
            <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">
              O Grupo B (baixa tensão) é a faixa de residências e comércios. Nesse porte, você mesmo
              dimensiona e compra o Master Block em minutos — sem esperar proposta.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/protecao-comercial" className="btn-primary group">
                Montar minha proteção
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
              <button
                type="button"
                onClick={() => setGrupo('')}
                className="inline-flex items-center rounded-btn border border-[rgb(var(--border))] px-5 py-2.5 font-sans text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:border-gold hover:text-gold"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="calculadora"
      className="scroll-mt-28 overflow-hidden rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
    >
      {/* Barra de progresso */}
      <div className="border-b border-[rgb(var(--border))] px-6 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold text-[rgb(var(--text-muted))]">
            {status === 'success' ? 'Projeto enviado' : `Passo ${passo} de ${TOTAL_PASSOS}`}
          </span>
          <span className="font-sans text-xs text-[rgb(var(--text-muted))]">
            resposta do representante em ≤3h úteis
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
            {/* ── Passo 1 — Triagem grupo tarifário ──────────────── */}
            {passo === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    Sua conta de energia é do Grupo A ou do Grupo B?
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    É a classificação da concessionária. Não sabe de cabeça? Segue no Grupo A que a
                    gente confirma.
                  </p>
                </div>
                <div className="grid gap-3">
                  {[
                    { v: 'A' as Grupo, Icon: Factory, t: 'Grupo A — média/alta tensão', d: 'Indústria e grande comércio (≥ 2,3 kV, com subestação/cabine primária). Locação.' },
                    { v: 'B' as Grupo, Icon: Home, t: 'Grupo B — baixa tensão', d: 'Residência e pequeno comércio (127/220/380 V). Compra direta.' },
                    { v: 'naosei' as Grupo, Icon: HelpCircle, t: 'Não sei', d: 'Sem problema — seguimos e a engenharia confirma pela sua conta de luz.' },
                  ].map(({ v, Icon, t, d }) => {
                    const sel = grupo === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setGrupo(v)}
                        className={`${cardBtn} ${sel ? 'border-gold bg-gold/[0.06]' : 'border-[rgb(var(--border))] hover:border-gold/50'}`}
                      >
                        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn ${sel ? 'bg-gold/15 text-gold' : 'bg-cyan/10 text-cyan'}`}>
                          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block font-semibold text-[rgb(var(--text))]">{t}</span>
                          <span className="mt-0.5 block text-xs text-[rgb(var(--text-muted))]">{d}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Passo 2 — Entrada de energia ───────────────────── */}
            {passo === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    Como a energia entra na sua planta?
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    A raiz da árvore. É daqui que a proteção em cascata começa a descer.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Concessionária (opcional)"
                    name="concessionaria"
                    placeholder="Ex.: Neoenergia, CPFL…"
                    value={concessionaria}
                    onChange={(e) => setConcessionaria(e.target.value)}
                  />
                  <div className="space-y-1.5">
                    <label htmlFor={`${baseId}-tensao`} className="block text-xs font-sans font-semibold text-[rgb(var(--text-muted))]">
                      Tensão de entrada
                    </label>
                    <select
                      id={`${baseId}-tensao`}
                      value={tensaoEntrada}
                      onChange={(e) => setTensaoEntrada(e.target.value)}
                      className="w-full rounded-btn border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-2.5 font-sans text-sm outline-none transition-colors focus:border-gold"
                    >
                      <option value="">Selecione…</option>
                      {TENSOES_ENTRADA.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Passo 3 — Planta (setores/galpões) ─────────────── */}
            {passo === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    Quais setores ou galpões você quer proteger?
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Cada setor vira um ramo da árvore. Dá pra dar nome (usinagem, empacotamento, G01…).
                  </p>
                </div>
                <div className="space-y-3">
                  {setores.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <TextField
                        label={i === 0 ? 'Setor / galpão' : ''}
                        name={`setor-${i}`}
                        placeholder="Ex.: Galpão G02 — injeção"
                        value={s}
                        onChange={(e) => setSetores((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                        className="flex-1"
                      />
                      {setores.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSetores((prev) => prev.filter((_, j) => j !== i))}
                          aria-label="Remover setor"
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] transition-colors hover:border-gold hover:text-gold ${i === 0 ? 'mt-6' : ''}`}
                        >
                          <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSetores((prev) => [...prev, ''])}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:text-gold"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Adicionar setor
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-card border border-[rgb(var(--border))] p-4">
                  <div>
                    <span className="block font-sans text-sm font-semibold text-[rgb(var(--text))]">Painéis de distribuição</span>
                    <span className="text-xs text-[rgb(var(--text-muted))]">Quadros de baixa tensão a proteger na cascata.</span>
                  </div>
                  <Stepper value={nPaineis} onChange={(d) => setNPaineis((v) => Math.max(1, v + d))} />
                </div>
              </div>
            )}

            {/* ── Passo 4 — Pontos sensíveis ─────────────────────── */}
            {passo === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    Quantos pontos sensíveis existem na planta?
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    São os eletrônicos que o Master Block protege. Não precisa ser exato — uma
                    estimativa já monta o projeto. Não sabe?{' '}
                    {whatsappExternal ? (
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold underline">manda uma foto do projeto</a>
                    ) : (
                      <Link href={whatsappHref} className="font-semibold text-gold underline">manda uma foto do projeto</Link>
                    )}{' '}que a engenharia levanta.
                  </p>
                </div>
                <div className="space-y-3">
                  {PONTOS.map(({ key, Icon, label, ajuda }) => (
                    <div key={key} className="flex items-center justify-between rounded-card border border-[rgb(var(--border))] p-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-cyan/10 text-cyan">
                          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        <div>
                          <span className="block font-sans text-sm font-semibold text-[rgb(var(--text))]">{label}</span>
                          <span className="text-xs text-[rgb(var(--text-muted))]">{ajuda}</span>
                        </div>
                      </div>
                      <Stepper value={pontos[key] ?? 0} onChange={(d) => setPonto(key, d)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Passo 5 — Resumo (projeto) + captura ───────────── */}
            {passo === 5 && (
              <div className="space-y-5">
                {/* Projeto montado */}
                <div className="rounded-card-lg bg-deep_navy p-6 text-white md:p-7">
                  <div className="text-[11px] font-sans font-bold text-white/60">Seu projeto de proteção em cascata</div>
                  <div className="mt-3 space-y-2 text-sm text-white/85">
                    <p><span className="text-white/60">Entrada:</span> {concessionaria.trim() || 'concessionária'} · {tensaoEntrada || '—'}</p>
                    <p><span className="text-white/60">Setores:</span> {setoresValidos.join(' · ') || '—'} <span className="text-white/50">({nPaineis} painel{nPaineis > 1 ? 'es' : ''} de distribuição)</span></p>
                    <p><span className="text-white/60">Pontos sensíveis:</span>{' '}
                      {totalPontos > 0
                        ? PONTOS.filter((p) => (pontos[p.key] ?? 0) > 0).map((p) => `${pontos[p.key]} ${p.label.toLowerCase()}`).join(' · ')
                        : 'a levantar com a engenharia'}
                    </p>
                  </div>
                  {/* Dimensionamento em cascata: nº de MB por camada + custo */}
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="text-[11px] font-sans font-bold text-white/60">
                      Master Blocks por camada
                    </div>
                    <ul className="mt-2.5 space-y-2">
                      {projeto.linhas.map((l) => (
                        <li key={l.camada.id} className="flex items-baseline justify-between gap-4 text-sm">
                          <span className="text-white/85">
                            <span className="font-semibold text-white">{l.quantidade}×</span>{' '}
                            {l.camada.nome}
                          </span>
                          <span className="shrink-0 tabular-nums text-white/70">
                            {formatBRL(l.subtotal)}/mês
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/10 pt-4">
                      <span className="text-sm text-white/60">
                        {projeto.totalMB} Master Blocks · locação estimada
                      </span>
                      <span className="font-serif text-3xl font-bold text-gold">
                        {formatBRL(projeto.mensalidadeTotal)}<span className="text-lg">/mês</span>
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-white/60">
                    Estimativa pela planta que você montou. O representante confirma o dimensionamento
                    e fecha o valor — e você só passa a pagar depois do período de avaliação, se
                    aprovar o resultado.
                  </p>
                </div>

                {/* ⛔ Enquanto a tabela real não chega: deixa explícito que o
                    número é simulado, pra ninguém tratar como proposta. */}
                {VALORES_SIMULADOS && (
                  <div className="flex items-start gap-3 rounded-card border border-gold/40 bg-gold/[0.08] p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={2} aria-hidden="true" />
                    <p className="text-sm leading-relaxed text-[rgb(var(--text))]">
                      <span className="font-semibold">Valores de simulação (ambiente de teste).</span>{' '}
                      A tabela oficial de locação ainda não está publicada — os números acima servem
                      só para experimentar a ferramenta e não valem como proposta.
                    </p>
                  </div>
                )}

                {/* PDF do projeto — o cliente leva pro comitê de compra. */}
                <button
                  type="button"
                  onClick={baixarPdf}
                  disabled={gerandoPdf}
                  className="inline-flex items-center gap-2 rounded-btn border border-[rgb(var(--border))] px-5 py-2.5 font-sans text-sm font-semibold text-[rgb(var(--text))] transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
                >
                  {gerandoPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  )}
                  Baixar o projeto em PDF
                </button>

                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    Receba a proposta de locação
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Um representante confirma o projeto tecnicamente e retorna em{' '}
                    <span className="font-semibold text-[rgb(var(--text))]">até 3 horas úteis</span>.
                  </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Seu nome" name="name" autoComplete="name" required />
                    <TextField label="Empresa" name="company" autoComplete="organization" required />
                    <TextField label="E-mail corporativo" name="email" type="email" autoComplete="email" required />
                    <TextField label="WhatsApp" name="whatsapp" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" required />
                  </div>
                  <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
                    <input type="checkbox" name="lgpd_consent" required className="mt-0.5 accent-[#F39200]" />
                    <span>
                      {LGPD_PUBLIC_DEFAULT.text}{' '}
                      <Link href="/politica-de-privacidade" className="underline hover:text-gold">Política de Privacidade</Link>.
                    </span>
                  </label>
                  <HoneypotField />
                  <TurnstileWidget onToken={setCaptchaToken} />
                  {status === 'error' && <FormStatus status="error" message={message} />}
                  <button type="submit" disabled={status === 'submitting'} className="btn-primary group w-full justify-center sm:w-auto">
                    {status === 'submitting' ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        Receber proposta de locação
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── Navegação ──────────────────────────────────────── */}
            <div className="mt-8 flex items-center justify-between">
              {passo > 1 ? (
                <button
                  type="button"
                  onClick={() => irPara(passo - 1)}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-[rgb(var(--border))] px-4 py-2 font-sans text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:border-gold hover:text-gold"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Voltar
                </button>
              ) : (
                <span />
              )}
              {passo < TOTAL_PASSOS && (
                <button
                  type="button"
                  onClick={() => irPara(passo + 1)}
                  disabled={!podeAvancar()}
                  className="btn-primary group disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Stepper grande (a jornada é "ir colocando os números").
function Stepper({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(-1)}
        aria-label="Diminuir"
        className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] transition-colors hover:border-gold hover:text-gold"
      >
        <Minus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="w-10 text-center font-serif text-xl font-bold tabular-nums text-[rgb(var(--text))]">{value}</span>
      <button
        type="button"
        onClick={() => onChange(1)}
        aria-label="Aumentar"
        className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] transition-colors hover:border-gold hover:text-gold"
      >
        <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
