'use client';

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
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
  ShieldCheck,
  HardHat,
  BadgeCheck,
  MessageCircle,
  Wrench as Chave,
} from 'lucide-react';
import { TextField } from '@/components/forms/fields/TextField';
import { HoneypotField } from '@/components/forms/fields/HoneypotField';
import { TurnstileWidget } from '@/components/forms/fields/TurnstileWidget';
import { FormStatus, type FormStatusKind } from '@/components/forms/fields/FormStatus';
import { LGPD_PUBLIC_DEFAULT, LGPD_PUBLIC_IMPLICITO } from '@/lib/lgpd-public';
import { trackEvent } from '@/lib/analytics';
import { enviarLeadOrcamento, type ResultadoEnvio } from '@/lib/forms/enviar-lead-orcamento';
import { WizardShell } from '@/components/tools/wizard/WizardShell';
import { selecionarMasterBlock, formatBRL, MB_LOAD_MAX } from '@/lib/constants/masterblock';
import { OfertaCheckout } from '@/components/tools/OfertaCheckout';
import {
  GATEWAY_ATIVO, FORMAS_PAGAMENTO, freteDoPedido, enderecoVazio,
  enderecoCompleto, enderecoEmUmaLinha,
  type Endereco, type FormaPagamentoId,
} from '@/lib/constants/pagamento';
import { documentoValido, mascararDocumento, apenasDigitos } from '@/lib/constants/documento';

// A corrente dimensiona o Master Block — texto ali não significa nada. O campo
// aceita SÓ dígito (a digitação já é filtrada) e o valor é validado contra a
// faixa real da linha: 1 A até MB_LOAD_MAX.
function soDigitos(v: string): string {
  return v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 5);
}

/** 01310100 → 01310-100 (o estado guarda só dígito; a máscara é de exibição). */
function mascararCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function parseAmp(s: string): number {
  const n = parseInt(soDigitos(s), 10);
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
const PASSOS_BASE = 4; // +1 (checkout) quando há preço pra fechar

/** De onde veio a corrente que a IA do WhatsApp (fluxo C1) apurou. Só
 *  'estimativa' muda alguma coisa na tela: número chutado merece conferência
 *  antes de virar pedido. */
type OrigemCorrente = 'disjuntor' | 'conta' | 'estimativa';

export type Semente = {
  corrente: string;
  tensao: string;
  origem: OrigemCorrente | null;
  contexto: ContextoId | '';
  /** Quadros adicionais que o bot já levantou, cada um com a corrente dele. */
  quadros: { nome: string; corrente: string }[];
};

/** Compara rótulo de quadro sem depender de acento, caixa ou pontuação:
 *  "camara fria", "Câmara Fria" e "CÂMARA-FRIA" viram a mesma chave. Quem monta
 *  o link é a IA, e cobrar o rótulo exato só produziria link que não semeia. */
const chaveDe = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // marcas de acento
    .replace(/[^a-z0-9]/g, '');

/** Corrente válida pra linha Master Block, ou '' se o parâmetro estiver sujo. */
function correnteValida(bruto: string): string {
  // Exige dígito puro (aceita só o "A" que a IA às vezes escreve junto). Sem
  // isso, `soDigitos` transformaria "-40" em 40 — inventar o número de outra
  // pessoa a partir de um parâmetro sujo é pior que abrir em branco.
  const cru = bruto.trim().replace(/\s|A$/gi, '');
  const amp = /^\d+$/.test(cru) ? parseInt(cru, 10) : NaN;
  return Number.isFinite(amp) && amp > 0 && amp <= MB_LOAD_MAX ? String(amp) : '';
}

/** Lê `?contexto=comercio&corrente=63&tensao=220&origem=disjuntor&quadros=...`.
 *
 *  O valor da URL é SUGESTÃO, nunca trava: entra no campo e a pessoa corrige à
 *  vontade. Valor sujo (texto, zero, acima da linha, contexto que não existe
 *  nesta LP) é simplesmente ignorado — o wizard para no passo daquele dado, sem
 *  erro na cara de quem só clicou num link.
 *
 *  `quadros` é uma lista `rótulo:corrente` separada por vírgula, ex.:
 *  `quadros=camara fria:40,PDV / servidores:25`. Só entra o quadro que existe
 *  NO CONTEXTO informado e que veio com corrente válida — quadro marcado sem
 *  número é justamente o que o passo 3 proíbe.
 *
 *  `setor` é obrigatório pra validar contexto e quadros: os presets mudam entre
 *  a LP residencial e a comercial, e semear "câmara fria" numa casa seria
 *  inventar. Sem ele, esses dois campos voltam vazios. */
export function lerSemente(busca: string, setor?: Setor): Semente {
  const q = new URLSearchParams(busca);

  const corrente = correnteValida(q.get('corrente') ?? '');

  const bruta = (q.get('tensao') ?? '').trim().toUpperCase().replace(/\s|VOLTS?$/g, '');
  const alvo = bruta.endsWith('V') ? bruta : `${bruta}V`;
  const tensao = (TENSOES as readonly string[]).includes(alvo) ? alvo : '';

  const o = (q.get('origem') ?? '').toLowerCase();
  const origem = o === 'disjuntor' || o === 'conta' || o === 'estimativa' ? o : null;

  // Contexto só vale se existir NESTA LP: 'casa' não existe na comercial nem
  // 'câmara fria' na residencial.
  const ctxBruto = chaveDe(q.get('contexto') ?? '');
  const daLp = setor ? CONTEXTOS[setor] : [];
  const contexto = (daLp.find((c) => chaveDe(c.id) === ctxBruto)?.id ?? '') as ContextoId | '';

  const presets = contexto ? (daLp.find((c) => c.id === contexto)?.quadros ?? []) : [];
  const quadros = (q.get('quadros') ?? '')
    .split(',')
    .map((par) => {
      const i = par.lastIndexOf(':');
      if (i === -1) return null;
      const nome = presets.find((n) => chaveDe(n) === chaveDe(par.slice(0, i)));
      const amp = correnteValida(par.slice(i + 1));
      return nome && amp ? { nome, corrente: amp } : null;
    })
    .filter((x): x is { nome: string; corrente: string } => x !== null);

  return { corrente, tensao, origem, contexto, quadros };
}

/** Primeiro passo que a semente NÃO conseguiu preencher.
 *
 *  Nunca pula por cima de campo vazio, e nunca passa do 4: o passo 4 é nome,
 *  WhatsApp e e-mail — dado da pessoa, que o bot está proibido de coletar.
 *  Abrir o checkout com contato que ninguém confirmou seria pior que o atrito
 *  que este atalho resolve. */
export function passoDaSemente(s: Semente): number {
  if (!s.contexto) return 1;
  if (!s.corrente || !s.tensao) return 2;
  return 4;
}

/** Blocos de confiança do passo 5 (checkout-ni-spec.md).
 *
 *  É a tela onde a pessoa decide gastar dinheiro sem falar com ninguém — as
 *  perguntas que ela faria a um vendedor precisam estar respondidas ali.
 *
 *  ⚠️ Só fato já comprovável e já publicado no site: garantia, instalação pelo
 *  próprio eletricista, 26 anos sem acidente + FIESP, patente. Nada de número
 *  novo aqui. Fica ABAIXO do botão e em cinza — quem já decidiu não é
 *  interrompido; quem travou encontra a resposta. */
function ConfiancaCheckout({ href, externo }: { href: string; externo: boolean }) {
  const itens = [
    { Icon: ShieldCheck, titulo: 'Garantia de 3 anos', texto: '+1 ano se você mandar um depoimento.' },
    { Icon: Chave, titulo: 'Instale com seu eletricista', texto: 'Vai com manual. Não precisa de técnico da Somatec.' },
    { Icon: HardHat, titulo: '26 anos sem um acidente', texto: 'Prêmio FIESP Acelera Startup 2015.' },
    { Icon: BadgeCheck, titulo: 'Produto patenteado', texto: 'Fabricação exclusiva no Brasil.' },
  ];

  return (
    <div className="border-t border-[rgb(var(--border))] pt-5">
      <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {itens.map(({ Icon, titulo, texto }) => (
          <li key={titulo} className="flex items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-xs leading-relaxed text-[rgb(var(--text-muted))]">
              <span className="font-sans font-semibold text-[rgb(var(--text))]">{titulo}</span>
              {' — '}
              {texto}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
        <MessageCircle className="h-4 w-4 shrink-0 text-cyan" strokeWidth={1.75} aria-hidden="true" />
        Ficou alguma dúvida antes de fechar?{' '}
        {externo ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold underline">
            Fale com a gente no WhatsApp
          </a>
        ) : (
          <Link href={href} className="font-semibold text-gold underline">
            Fale com a gente no WhatsApp
          </Link>
        )}
      </p>
    </div>
  );
}

function ConsentimentoLgpd() {
  return (
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
  );
}

/** Aviso do passo de CONTATO — consentimento implícito.
 *
 *  Não é caixa de marcar: quem preenche já está consentindo, e é isso que o
 *  texto precisa dizer ANTES de a pessoa digitar. Sem o aviso visível, a
 *  captura de quem não conclui não teria base pra existir. */
const ALVO_LINK = 'Política de Privacidade';

function AvisoLgpdContato() {
  // O texto é a FONTE do consentimento (o servidor guarda o hash dele), então
  // ele não pode ser reescrito aqui pra caber no link. Parte-se o texto na
  // expressão a linkar; se um dia a copy mudar e a expressão sumir, cai no
  // texto inteiro + link no fim — some o link no meio, não o aviso.
  const i = LGPD_PUBLIC_IMPLICITO.text.indexOf(ALVO_LINK);
  const antes = i >= 0 ? LGPD_PUBLIC_IMPLICITO.text.slice(0, i) : LGPD_PUBLIC_IMPLICITO.text + ' ';
  const depois = i >= 0 ? LGPD_PUBLIC_IMPLICITO.text.slice(i + ALVO_LINK.length) : '';

  return (
    <p className="text-xs leading-relaxed text-[rgb(var(--text-muted))]">
      {antes}
      <Link href="/politica-de-privacidade" className="underline hover:text-gold">
        {ALVO_LINK}
      </Link>
      {depois}
    </p>
  );
}

export function CheckoutNI({ setor, landingSlug, whatsappHref, whatsappExternal = false }: Props) {
  const baseId = useId();
  const startedRef = useRef(false);

  const [passo, setPasso] = useState(1);
  const [contexto, setContexto] = useState<ContextoId | ''>('');
  const [tensao, setTensao] = useState('');
  const [corrente, setCorrente] = useState('');
  const [naoSei, setNaoSei] = useState(false);
  /** Sinaliza que os campos vieram do link do WhatsApp — muda só a microcópia. */
  const [origemUrl, setOrigemUrl] = useState<OrigemCorrente | null>(null);
  const [veioDeLink, setVeioDeLink] = useState(false);
  /** Quadros adicionais escolhidos + a corrente de cada um (opcional: sem ela,
   *  o secundário vai "a dimensionar no contato" em vez de já vir com preço). */
  const [adicionais, setAdicionais] = useState<{ nome: string; corrente: string }[]>([]);

  // Contato vira estado (não FormData): o passo 4 desmonta ao ir pro checkout.
  const [contato, setContato] = useState({ nome: '', whatsapp: '', email: '', empresa: '' });
  const [endereco, setEndereco] = useState<Endereco>(enderecoVazio);
  // CPF/CNPJ: sem ele não se emite nota, e sem nota não sai etiqueta. Fica no
  // passo do checkout (não no de contato) pra não pedir documento de quem só
  // quer orçamento.
  const [documento, setDocumento] = useState('');
  const [cepBuscando, setCepBuscando] = useState(false);
  const [cepMsg, setCepMsg] = useState<string | null>(null);
  const [pagamento, setPagamento] = useState<FormaPagamentoId | ''>('');
  const [freteOpcoes, setFreteOpcoes] = useState<{ nome: string; transportadora: string; valor: number; prazoDias: number | null }[]>([]);

  const [status, setStatus] = useState<FormStatusKind>('idle');
  const [message, setMessage] = useState<string | null>(null);
  /** Número do pedido, quando o checkout virou pedido de verdade. */
  const [numeroDoPedido, setNumeroPedido] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  // Captcha PRÓPRIO do passo de contato: o token do passo 5 é de outra
  // submissão (uso único), e reaproveitar faria uma das duas ser recusada.
  // O widget é invisível, então não custa nada na tela.
  const [captchaContato, setCaptchaContato] = useState('');
  // Chave de quem já foi capturado — e-mail + telefone. Guarda "uma pessoa",
  // não "uma vez": se ela corrigir o e-mail e avançar de novo, é outro
  // contato e vale capturar; digitar o mesmo dez vezes não vira dez leads.
  const abandonoEnviadoRef = useRef<string>('');

  // A corrente pode chegar pronta pelo link que a IA manda no WhatsApp
  // (fluxo C1): ela já fez o trabalho difícil de descobrir o disjuntor, então
  // pedir o número de novo é atrito puro.
  //
  // Lido no MOUNT, do window, e não com useSearchParams: as LPs são estáticas
  // (revalidate 3600) e o hook forçaria Suspense/render dinâmico — pagar
  // performance em toda visita por causa de um parâmetro que quase nunca vem.
  useEffect(() => {
    const s = lerSemente(window.location.search, setor);
    if (!s.corrente && !s.tensao && !s.contexto && s.quadros.length === 0) return;
    // A URL só existe no client; semear no mount (e não no useState) é o que
    // evita mismatch de hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mesma convenção de HomeHero/CookieBanner: valor que só existe no client, semeado uma vez no mount
    if (s.contexto) setContexto(s.contexto);
    if (s.corrente) setCorrente(s.corrente);
    if (s.tensao) setTensao(s.tensao);
    if (s.quadros.length) setAdicionais(s.quadros);
    setOrigemUrl(s.origem);
    setVeioDeLink(true);
    // Abre no primeiro passo que a semente NÃO preencheu, pra pessoa não
    // refazer no site o que acabou de responder no WhatsApp. Nunca passa do 4:
    // o 5 exigiria o contato, que o bot está proibido de coletar.
    setPasso(passoDaSemente(s));
  }, [setor]);

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
    // Saindo do contato PRA FRENTE: a pessoa entregou os dados. Daqui ela
    // pode fechar, desistir ou sumir — o lead já está garantido.
    if (passo === 4 && n > passo) capturarAbandono();

    const alvo = Math.min(totalPassos, Math.max(1, n));
    setPasso(alvo);
    trackEvent('calc_passo', { setor, landing: landingSlug, passo: alvo });
    if (alvo === PASSOS_BASE) {
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

  // ── LEAD DE ABANDONO ────────────────────────────────────────────────────
  // Quem preencheu o contato e não concluiu também é lead: hoje o CRM só
  // recebe quem CHEGA AO FIM, e o resto do funil evapora.
  //
  // Dispara ao AVANÇAR do passo de contato e ao SAIR da página com os campos
  // preenchidos — nunca a cada tecla, que encheria o CRM de leads pela metade
  // (uma pessoa vira dez "Jo", "Joa", "Joao").
  //
  // Consentimento IMPLÍCITO: vale o aviso que ela leu ali, não o checkbox do
  // passo 5, que ela nunca viu. Quem separa os dois é o slug + o par
  // versão/hash do texto, montados no servidor.
  const capturarAbandono = useCallback(() => {
    const nome = contato.nome.trim();
    const email = contato.email.trim();
    const whatsapp = contato.whatsapp.trim();
    if (!nome || !email || !whatsapp) return;

    const chave = `${email.toLowerCase()}|${whatsapp.replace(/\D/g, '')}`;
    if (abandonoEnviadoRef.current === chave) return;
    // Marca ANTES de enviar pra não duplicar se avançar duas vezes rápido —
    // mas DEVOLVE a chave se o envio falhar. Sem isso, um captcha que ainda
    // não gerou token queimaria a única tentativa: o servidor recusa, e o
    // `pagehide` mais tarde nem tentaria de novo. O lead sumiria calado,
    // que é exatamente o buraco que esta feature veio tapar.
    abandonoEnviadoRef.current = chave;

    void enviarLeadOrcamento({
      formulario: 'checkout-ni-abandono',
      nome,
      email,
      whatsapp,
      empresa: contato.empresa,
      segmento: `NI · ${setor}`,
      publico: setor === 'residencial' ? 'residencia' : 'comercio',
      resumo:
        `[Checkout abandonado] Contexto: ${ctxAtual?.label ?? '—'}. ` +
        `Quadro de entrada: ${naoSei ? 'não sabe os dados' : `tensão ${tensao || '—'}, corrente ${corrente.trim() || '—'}`}. ` +
        (modelo ? `Dimensionado: ${modelo.model} (${formatBRL(modelo.preco)}). ` : '') +
        'Preencheu o contato e não concluiu.',
      sourcePage: `/${landingSlug}`,
      // Implícito: a pessoa consentiu ao preencher, sob o aviso do passo 4.
      lgpdConsent: true,
      honeypot: '',
      captchaToken: captchaContato,
    }).then((r) => {
      if (!r.ok && abandonoEnviadoRef.current === chave) abandonoEnviadoRef.current = '';
    });
  }, [contato, setor, landingSlug, ctxAtual, naoSei, tensao, corrente, modelo, captchaContato]);

  // Saiu da aba/página com o contato preenchido: é a outra metade do abandono
  // — quem não avança nem fecha, só some. `pagehide` porque `beforeunload` não
  // dispara com confiança no celular.
  useEffect(() => {
    const aoSair = () => capturarAbandono();
    window.addEventListener('pagehide', aoSair);
    return () => window.removeEventListener('pagehide', aoSair);
  }, [capturarAbandono]);

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

  /** Checkout (passo 5) só existe quando há preço fechado pra comprar. */
  const totalPassos = temPreco ? PASSOS_BASE + 1 : PASSOS_BASE;
  const frete = freteDoPedido();
  const totalPedido = totalCarrinho + (Number.isFinite(frete.valor) ? frete.valor : 0);
  const contatoOk = Boolean(contato.nome.trim() && contato.whatsapp.trim() && contato.email.trim());

  async function buscarCep(valor: string) {
    const cep = valor.replace(/\D/g, '');
    setEndereco((e) => ({ ...e, cep }));
    if (cep.length !== 8) return;
    setCepBuscando(true);
    setCepMsg(null);
    try {
      const r = await fetch(`/api/cep?cep=${cep}`);
      const d = (await r.json()) as { ok: boolean; endereco?: Endereco; message?: string };
      if (d.ok && d.endereco) {
        // Preserva número/complemento, que o ViaCEP não tem.
        setEndereco((e) => ({ ...e, ...d.endereco!, numero: e.numero, complemento: e.complemento }));
      } else {
        setCepMsg(d.message ?? 'CEP não encontrado.');
      }
    } catch {
      setCepMsg('Não consegui buscar o CEP. Preencha o endereço à mão.');
    } finally {
      setCepBuscando(false);
    }
    // Frete real (Melhor Envio). Sem credencial devolve lista vazia e o
    // checkout segue: a promoção já zera o valor, só falta o prazo.
    try {
      const itens = itensCarrinho
        .filter((i) => i.modelo)
        .map((i) => ({ model: i.modelo?.model ?? '', quantidade: 1 }));
      const r = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cepDestino: cep, itens }),
      });
      const d = (await r.json()) as { ok: boolean; opcoes?: typeof freteOpcoes };
      setFreteOpcoes(d.ok && d.opcoes ? d.opcoes : []);
    } catch {
      setFreteOpcoes([]);
    }
  }

  /** Prazo mostrado: o real do Melhor Envio quando existe; senão o texto do config. */
  const prazoEntrega =
    freteOpcoes.length > 0 && freteOpcoes[0].prazoDias
      ? `Entrega estimada em ${freteOpcoes[0].prazoDias} dia(s) úteis${freteOpcoes[0].transportadora ? ` — ${freteOpcoes[0].transportadora}` : ''}.`
      : `Prazo de entrega ${freteDoPedido().prazo}.`;

  /** Quadros marcados que ficaram sem corrente. REGRA de todos os wizards:
   *  item marcado sem número não passa — o cliente veria um "a dimensionar" que
   *  ele nem sabe que pediu, e o pedido sairia com preço incompleto. Marcar é
   *  opcional; depois de marcado, o número é obrigatório. */
  const adicionaisSemCorrente = adicionais.filter((a) => parseAmp(a.corrente) === 0);

  function podeAvancar(): boolean {
    if (passo === 1) return contexto !== '';
    if (passo === 2) return naoSei || (tensao !== '' && parseAmp(corrente) > 0);
    if (passo === 3) return adicionaisSemCorrente.length === 0;
    if (passo === 4) return contatoOk; // só avança pro checkout com contato
    return true;
  }

  function motivoBloqueio(): string | null {
    if (passo === 2 && !naoSei) {
      if (tensao === '') return 'Escolha a tensão pra continuar.';
      if (parseAmp(corrente) === 0) return 'Informe a corrente do disjuntor geral, em ampères.';
    }
    if (passo === 3 && adicionaisSemCorrente.length > 0) {
      return adicionaisSemCorrente.length === 1
        ? `Informe a corrente do quadro "${adicionaisSemCorrente[0].nome}" — ou desmarque ele.`
        : `${adicionaisSemCorrente.length} quadros marcados estão sem a corrente. Preencha ou desmarque.`;
    }
    if (passo === 4 && !contatoOk) return 'Preencha nome, WhatsApp e e-mail pra continuar.';
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    // Duas jornadas OPOSTAS saem daqui: pedido fechado (esperando link de
    // pagamento) e lead morno (esperando orçamento). Do lado do Betinna são
    // fluxos diferentes, então saem com `formulario` diferente — não dá pra
    // deixar o CRM adivinhar pelo texto do resumo.
    const virouPedido = enderecoCompleto(endereco) && pagamento !== '' && documentoValido(documento);
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
      `Quadro de entrada: ${dadosQuadro}. ${dimensionamento} ${adic}` +
      (enderecoCompleto(endereco)
        ? ` ENTREGA: ${enderecoEmUmaLinha(endereco)}. Frete: ${frete.valor === 0 ? 'grátis (promoção)' : formatBRL(frete.valor)}. ` +
          `Pagamento escolhido: ${FORMAS_PAGAMENTO.find((f) => f.id === pagamento)?.label ?? '—'}. ` +
          `Total do pedido: ${formatBRL(totalPedido)}.`
        : '');
    const resumoLimpo = resumo.replace(/\s+/g, ' ').trim();

    // ── NÚMERO DO PEDIDO ──────────────────────────────────────────────
    // Só pedido fechado ganha número. Orçamento é lead morno, ainda não
    // existe pedido pra acompanhar — dar número aí prometeria uma tela de
    // rastreio que não teria o que mostrar.
    //
    // Vem ANTES do lead de propósito: se o registro falhar, o cliente não
    // recebe um "pedido confirmado" sem ter como consultar depois.
    let numeroPedido: string | null = null;
    // Quando o /api/pedidos entrega o lead pelo servidor, este envio aqui não
    // acontece — senão o CRM receberia dois.
    let leadJaEntregue = false;
    if (virouPedido) {
      try {
        const resp = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: contato.nome,
            email: contato.email,
            whatsapp: contato.whatsapp,
            empresa: contato.empresa || null,
            documento: apenasDigitos(documento),
            itens: itensCarrinho.map((i) => ({
              descricao: i.quadro,
              modelo: i.modelo?.model ?? null,
              quantidade: 1,
              precoCentavos: Math.round((i.modelo?.preco ?? 0) * 100),
            })),
            totalCentavos: Math.round(totalPedido * 100),
            freteCentavos: Math.round((Number.isFinite(frete.valor) ? frete.valor : 0) * 100),
            formaPagamento: FORMAS_PAGAMENTO.find((f) => f.id === pagamento)?.label ?? pagamento,
            endereco,
            setor,
            origem: `site:${landingSlug}`,
            // O servidor precisa destes dois pra montar e entregar o LEAD por
            // lá — o resumo porque só o wizard sabe o que a pessoa montou, e o
            // consentimento porque sem ele o lead não vai pro CRM.
            resumo: resumoLimpo,
            lgpdConsent: fd.get('lgpd_consent') === 'on',
          }),
        });
        const j = (await resp.json()) as {
          ok?: boolean;
          numero?: string | null;
          leadEnviado?: boolean;
        };
        if (j?.ok && j.numero) numeroPedido = j.numero;
        // O servidor já entregou o lead (ou o pôs na fila, que dá no mesmo).
        // Mandar de novo daqui só duplicaria no CRM.
        if (j?.leadEnviado) leadJaEntregue = true;
      } catch {
        // Registro do pedido falhou. O lead ainda vai pro CRM logo abaixo, e
        // a equipe fecha na mão — a venda não se perde. O que muda é a
        // mensagem final, que não promete acompanhamento que não existe.
      }
    }

    // O lead do PEDIDO agora sai do servidor, junto com o pedido — assim ele
    // entra na fila com retentativa em vez de depender desta segunda chamada
    // do navegador, que some se a aba fechar.
    //
    // Este caminho segue valendo pra dois casos: o ORÇAMENTO (que não cria
    // pedido nenhum) e o pedido cujo registro falhou — aí não houve servidor
    // pra entregar, e é melhor um lead pelo navegador que lead nenhum.
    let r: ResultadoEnvio = { ok: true };
    if (!leadJaEntregue) {
      r = await enviarLeadOrcamento({
        formulario: virouPedido ? 'checkout-ni-pedido' : 'checkout-ni-orcamento',
        nome: contato.nome,
        email: contato.email,
        whatsapp: contato.whatsapp,
        empresa: contato.empresa,
        segmento: `NI · ${setor}`,
        // A LP já define o público — o lead sai roteável sem perguntar de novo.
        publico: setor === 'residencial' ? 'residencia' : 'comercio',
        resumo: numeroPedido ? `[Pedido ${numeroPedido}] ${resumoLimpo}` : resumoLimpo,
        sourcePage: `/${landingSlug}`,
        lgpdConsent: fd.get('lgpd_consent') === 'on',
        honeypot: fd.get('website'),
        captchaToken,
      });
    }

    if (r.ok) {
      setStatus('success');
      setNumeroPedido(numeroPedido);
      setMessage(
        virouPedido
          ? `Pedido registrado! Você vai receber a confirmação por e-mail e nossa equipe finaliza o pedido com você (${
              FORMAS_PAGAMENTO.find((f) => f.id === pagamento)?.label ?? 'pagamento'
            }). Frete e prazo já valem como mostrado.`
          : 'Recebido! Nossa equipe dimensiona o seu Master Block e te retorna com o valor — sem compromisso.',
      );
      trackEvent(virouPedido ? 'checkout_pedido' : 'calc_lead', {
        setor,
        landing: landingSlug,
        ...(virouPedido ? { total: totalPedido, pagamento, pedido: numeroPedido ?? 'sem-numero' } : {}),
      });
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
      totalPassos={totalPassos}
      nota="2 minutos · sem vendedor"
      rotuloSucesso="Pronto"
      status={status}
      mensagem={message}
      sucessoExtra={
        numeroDoPedido ? (
          <div className="rounded-card-lg border border-cyan/30 bg-cyan/5 p-5">
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">
              Número do pedido
            </p>
            <p className="mt-1.5 font-serif text-2xl font-semibold tracking-wide text-[rgb(var(--text))]">
              {numeroDoPedido}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
              Guarde este número — é com ele que você acompanha a entrega. Ele também vai no
              e-mail de confirmação.
            </p>
            <a
              href={`/pedido/${numeroDoPedido}`}
              className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-semibold text-cyan transition-opacity hover:opacity-80"
            >
              Acompanhar meu pedido →
            </a>
          </div>
        ) : null
      }
      podeAvancar={podeAvancar()}
      motivoBloqueio={motivoBloqueio()}
      onVoltar={() => irPara(passo - 1)}
      onContinuar={() => irPara(passo + 1)}
    >
      <>
        {/* Sem isto a pessoa não entende por que o wizard abriu no meio — e
            precisa saber que pode corrigir tudo que veio de lá. */}
        {veioDeLink && (
          <div className="mb-6 flex items-start gap-2.5 rounded-card border border-cyan/25 bg-cyan/[0.05] p-3.5 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan" strokeWidth={1.75} aria-hidden="true" />
            <span>
              <span className="font-sans font-semibold text-[rgb(var(--text))]">
                Já preenchemos com os dados do seu atendimento.
              </span>{' '}
              Confira e corrija o que precisar — dá pra voltar em qualquer passo.
            </span>
          </div>
        )}

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
                      pattern="[0-9]*"
                      maxLength={5}
                      placeholder="Ex.: 40, 63, 100…"
                      value={corrente}
                      onChange={(e) => setCorrente(soDigitos(e.target.value))}
                      hint={
                        veioDeLink && corrente !== ''
                          ? origemUrl === 'estimativa'
                            ? 'Veio da nossa conversa como estimativa — confirme no disjuntor antes de fechar.'
                            : 'Já preenchemos com o número da nossa conversa. Dá pra corrigir.'
                          : `Só números, de 1 a ${MB_LOAD_MAX} A (a faixa da linha Master Block).`
                      }
                      error={corrente !== '' && amp === 0 ? 'Informe a corrente em ampères.' : undefined}
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
                            preço dele. Marcou o quadro, o número é obrigatório
                            (senão o pedido sai com item sem preço). */}
                        {sel && (
                          <div className="px-4 pb-4">
                            <label
                              htmlFor={`${baseId}-adic-${q}`}
                              className="block pb-1.5 text-xs font-sans font-semibold text-[rgb(var(--text-muted))]"
                            >
                              Corrente do disjuntor deste quadro (A)
                            </label>
                            <input
                              id={`${baseId}-adic-${q}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={5}
                              placeholder="Ex.: 25, 40…"
                              value={escolhido.corrente}
                              onChange={(e) => setCorrenteAdicional(q, soDigitos(e.target.value))}
                              aria-invalid={parseAmp(escolhido.corrente) === 0 || undefined}
                              className="w-full rounded-btn border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-2 font-sans text-sm outline-none transition-colors focus:border-gold"
                            />
                            <p className="pt-1.5 text-xs text-[rgb(var(--text-muted))]">
                              {parseAmp(escolhido.corrente) === 0
                                ? 'Obrigatório — sem esse número não dá pra dimensionar este quadro.'
                                : `Só números, de 1 a ${MB_LOAD_MAX} A.`}
                            </p>
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

                {/* Frete grátis + brinde na janela de 20 min (despacho do doc). */}
                <OfertaCheckout />

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Seu nome" name="name" autoComplete="name" required
                      value={contato.nome}
                      onChange={(e) => setContato((c) => ({ ...c, nome: e.target.value }))}
                    />
                    <TextField
                      label="WhatsApp" name="whatsapp" inputMode="tel" autoComplete="tel"
                      placeholder="(11) 99999-9999" required
                      value={contato.whatsapp}
                      onChange={(e) => setContato((c) => ({ ...c, whatsapp: e.target.value }))}
                    />
                    {/* O wrapper leva o col-span, não o TextField: o
                        `className` dele vai pro <input>, e quem é item do grid
                        é a div de fora. Sem o campo de empresa ao lado, o
                        e-mail ocupa a linha inteira em vez de deixar meia
                        coluna vazia. */}
                    <div className={setor === 'comercial' ? undefined : 'sm:col-span-2'}>
                      <TextField
                        label="E-mail" name="email" type="email" autoComplete="email" required
                        value={contato.email}
                        onChange={(e) => setContato((c) => ({ ...c, email: e.target.value }))}
                      />
                    </div>
                    {/* Empresa SÓ na trilha comercial.
                     *
                     *  No residencial este campo pedia "Cidade" — e mandava o
                     *  valor no `company`, então a cidade aparecia no CRM como
                     *  nome da empresa do cliente.
                     *
                     *  Decisão do Léo (31/08): tirar, não remapear. Quem chega
                     *  ao checkout informa o CEP no passo seguinte, e dali sai
                     *  cidade, bairro e UF — mais preciso do que a pessoa
                     *  digitando. Um campo a mais no passo de MAIOR ATRITO não
                     *  se paga por um dado que já vem melhor logo adiante.
                     *
                     *  Efeito colateral bom: `empresa` no CRM passa a ser
                     *  empresa de verdade em 100% dos casos. */}
                    {setor === 'comercial' && (
                      <TextField
                        label="Empresa (opcional)"
                        name="company"
                        autoComplete="organization"
                        value={contato.empresa}
                        onChange={(e) => setContato((c) => ({ ...c, empresa: e.target.value }))}
                      />
                    )}
                  </div>

                  {/* Consentimento IMPLÍCITO: quem preenche já consente, e é
                      isto que dá base pra capturar quem não conclui. Precisa
                      estar VISÍVEL antes de a pessoa digitar. */}
                  <AvisoLgpdContato />
                  {/* Invisível — só produz o token do lead de abandono. */}
                  <TurnstileWidget onToken={setCaptchaContato} />

                  {/* Sem preço fechado não há o que comprar: encerra como
                      orçamento aqui mesmo, sem passar pelo checkout. */}
                  {!temPreco && (
                    <form onSubmit={onSubmit} className="space-y-4" noValidate>
                      <ConsentimentoLgpd />
                      <HoneypotField />
                      <TurnstileWidget onToken={setCaptchaToken} />
                      {status === 'error' && <FormStatus status="error" message={message} />}
                      <button type="submit" disabled={status === 'submitting'} className="btn-primary group w-full justify-center sm:w-auto">
                        {status === 'submitting' ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <>
                            Solicitar meu orçamento
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5" strokeWidth={2} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ── Passo 5 — CHECKOUT (entrega + pagamento) ───────── */}
            {passo === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[rgb(var(--text))]">
                    Para onde enviamos?
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Digite o CEP que o endereço se completa sozinho.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <TextField
                      label="CPF ou CNPJ" name="documento" inputMode="numeric"
                      placeholder="000.000.000-00" maxLength={18} required
                      value={mascararDocumento(documento)}
                      onChange={(e) => setDocumento(e.target.value)}
                      hint="Obrigatório para emitir a nota fiscal."
                      error={
                        apenasDigitos(documento).length >= 11 && !documentoValido(documento)
                          ? 'Confira o número — não confere.'
                          : undefined
                      }
                    />
                  </div>
                  <div className="sm:col-span-3" />
                  <div className="sm:col-span-2">
                    <TextField
                      label="CEP" name="cep" inputMode="numeric" autoComplete="postal-code"
                      placeholder="00000-000" maxLength={9} required
                      value={mascararCep(endereco.cep)}
                      onChange={(e) => buscarCep(e.target.value)}
                      hint={cepBuscando ? 'Buscando…' : undefined}
                      error={cepMsg ?? undefined}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <TextField
                      label="Rua / logradouro" name="logradouro" autoComplete="address-line1" required
                      value={endereco.logradouro}
                      onChange={(e) => setEndereco((x) => ({ ...x, logradouro: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <TextField
                      label="Número" name="numero" inputMode="numeric" required
                      value={endereco.numero}
                      onChange={(e) => setEndereco((x) => ({ ...x, numero: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <TextField
                      label="Complemento (opcional)" name="complemento" autoComplete="address-line2"
                      value={endereco.complemento}
                      onChange={(e) => setEndereco((x) => ({ ...x, complemento: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <TextField
                      label="Bairro" name="bairro" required
                      value={endereco.bairro}
                      onChange={(e) => setEndereco((x) => ({ ...x, bairro: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <TextField
                      label="Cidade" name="cidade" autoComplete="address-level2" required
                      value={endereco.cidade}
                      onChange={(e) => setEndereco((x) => ({ ...x, cidade: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <TextField
                      label="UF" name="uf" maxLength={2} autoComplete="address-level1" required
                      value={endereco.uf}
                      onChange={(e) => setEndereco((x) => ({ ...x, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                    />
                  </div>
                </div>

                {/* Resumo do pedido */}
                <div className="rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5">
                  <div className="text-[11px] font-sans font-bold text-[rgb(var(--text-muted))]">
                    Resumo do pedido
                  </div>
                  <ul className="mt-3 divide-y divide-[rgb(var(--border))]">
                    {itensCarrinho
                      .filter((i) => i.modelo)
                      .map((i) => (
                        <li key={i.quadro} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                          <span className="text-[rgb(var(--text))]">
                            <span className="font-semibold">{i.modelo?.model}</span>
                            <span className="ml-2 text-[rgb(var(--text-muted))]">{i.quadro}</span>
                          </span>
                          <span className="shrink-0 tabular-nums">{formatBRL(i.modelo?.preco ?? 0)}</span>
                        </li>
                      ))}
                    <li className="flex items-baseline justify-between gap-4 py-2 text-sm">
                      <span className="text-[rgb(var(--text))]">Frete</span>
                      <span className="shrink-0 font-semibold text-gold">
                        {frete.valor === 0 ? 'Grátis' : formatBRL(frete.valor)}
                      </span>
                    </li>
                  </ul>
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 border-t border-[rgb(var(--border))] pt-4">
                    <span className="text-sm text-[rgb(var(--text-muted))]">Total</span>
                    <span className="font-serif text-3xl font-bold text-[rgb(var(--text))]">
                      {formatBRL(totalPedido)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--text-muted))]">
                    {prazoEntrega}
                  </p>
                </div>

                {/* Forma de pagamento */}
                <div className="space-y-3">
                  <span className="block font-sans text-sm font-semibold text-[rgb(var(--text))]">
                    Como você prefere pagar?
                  </span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {FORMAS_PAGAMENTO.map((f) => {
                      const sel = pagamento === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={sel}
                          onClick={() => setPagamento(f.id)}
                          className={`rounded-card border p-4 text-left transition-colors ${
                            sel ? 'border-gold bg-gold/[0.06]' : 'border-[rgb(var(--border))] hover:border-gold/50'
                          }`}
                        >
                          <span className="block font-sans text-sm font-semibold text-[rgb(var(--text))]">
                            {f.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-[rgb(var(--text-muted))]">
                            {f.detalhe}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <OfertaCheckout />

                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                  <ConsentimentoLgpd />
                  <HoneypotField />
                  <TurnstileWidget onToken={setCaptchaToken} />
                  {status === 'error' && <FormStatus status="error" message={message} />}

                  {/* 🔒 REGRA (Léo, 19/08): a compra é SEMPRE no site. O WhatsApp
                      ajuda a identificar o modelo, nunca fecha. Enquanto o gateway
                      não liga, o pedido não morre — mas o texto NÃO pode prometer
                      link de pagamento por WhatsApp: terceiriza o fechamento pro
                      canal que a regra proíbe e cria promessa que só humano cumpre.
                      Sem prometer canal nem prazo. */}
                  {!GATEWAY_ATIVO && (
                    <p className="rounded-card border border-cyan/25 bg-cyan/[0.05] p-3 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
                      O pagamento online está em ativação. Confirme seus dados e nossa equipe
                      finaliza o pedido com você — o preço e as condições acima já valem.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      status === 'submitting' ||
                      !enderecoCompleto(endereco) ||
                      !pagamento ||
                      !documentoValido(documento)
                    }
                    className="btn-primary group w-full justify-center disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    {status === 'submitting' ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        Confirmar pedido
                        <ChevronRight
                          className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                          strokeWidth={2}
                        />
                      </>
                    )}
                  </button>
                </form>

                <ConfiancaCheckout href={whatsappHref} externo={whatsappExternal} />
              </div>
            )}

      </>
    </WizardShell>
  );
}
