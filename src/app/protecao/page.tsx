import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Home,
  Building2,
  Store,
  Factory,
  Zap,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { MasterBlockSelector } from '@/components/tools/MasterBlockSelector';
import { FrequencySpectrum } from '@/components/graphics/FrequencySpectrum';
import { ProofBadges } from '@/components/ui/ProofBadges';
import { Reveal } from '@/components/ui/Reveal';
import { MASTER_BLOCK_MODELS, formatBRL } from '@/lib/constants/masterblock';
import { buildCommercialCtaHref, getWhatsAppButtonConfig, isExternalCtaHref } from '@/lib/whatsapp-button';
import type { LucideIcon } from 'lucide-react';

/**
 * LANDING NÃO-INDUSTRIAL (despacho #12) — hub do 2º motor de venda.
 * Herda o design system da home: tema claro único, navy âncora, ritmo de tom,
 * cards com elevação, SEM textura, sentence case, SEM eyebrow, laranja = 1
 * foco por seção. Toda conversão passa pela calculadora (já captura lead pro
 * Betinna — reusada, não refeita). utm_campaign=protecao nos CTAs internos.
 */

// utm_campaign = slug da landing em todos os CTAs internos (despacho #12).
const CALC_HREF = '/ferramentas/orcamento?utm_campaign=protecao';

export const metadata: Metadata = {
  title: {
    absolute: 'Proteção contra surtos para casa, comércio e condomínio | Master Block',
  },
  description:
    'A mesma proteção das maiores indústrias do Brasil, agora para o seu negócio e a sua casa. Descubra o modelo e o preço em 2 minutos.',
  alternates: { canonical: '/protecao' },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export const revalidate = 3600;

// ── Seção 3 — pra quem é (5 públicos; copy do despacho) ─────────────
type Publico = {
  Icon: LucideIcon;
  nome: string;
  risco: string;
  /** null = foto nova do Estúdio ainda em produção → placeholder. */
  foto: string | null;
  alt: string;
};

const PUBLICOS: readonly Publico[] = [
  {
    Icon: Home,
    nome: 'Casa e apartamento',
    risco:
      'Automação, home theater, ar-condicionado e inversor solar — o patrimônio eletrônico da casa, todo na mesma rede.',
    foto: '/home/hero-nao-industrial.webp',
    alt: 'Sala de estar de alto padrão com automação e home theater',
  },
  {
    Icon: Building2,
    nome: 'Condomínio',
    risco:
      'Bombas, elevador, portaria, CFTV e interfonia — a manutenção que ninguém previu no orçamento.',
    foto: '/blog/casa-condominio.webp',
    alt: 'Edifício residencial com painéis solares no telhado',
  },
  {
    Icon: Store,
    nome: 'Comércio',
    risco:
      'Freezer, câmara fria, PDV e ar-condicionado. Um dia parado no comércio pesa igual ao de uma fábrica.',
    foto: '/blog/comercio-padaria.webp',
    alt: 'Padaria com forno industrial e vitrine refrigerada',
  },
  {
    Icon: Factory,
    nome: 'Pequena indústria',
    risco:
      'A mesma dor da grande, em escala menor — e resolvida com compra direta, sem locação.',
    foto: null,
    alt: 'Pequena indústria',
  },
  {
    Icon: Zap,
    nome: 'Carro elétrico',
    risco:
      'O carregador de parede e o sistema de carga do carro, ligados à rede por horas, de madrugada, sem ninguém por perto.',
    foto: '/home/ni-carro-eletrico.webp',
    alt: 'Carro elétrico carregando na garagem com carregador de parede',
  },
];

// ── Seção 7 — compra com segurança — ⏳ GATE (decisão 3 do Léo) ─────
// Estrutura pronta, TERMOS pendentes (garantia de fábrica, troca/devolução,
// prazo). NÃO inventar: enquanto null, a seção NÃO renderiza — quando o Léo
// definir os termos, preencher aqui e ela aparece sozinha.
const TERMOS_COMPRA: { titulo: string; texto: string }[] | null = null;

// ── Seção 8 — FAQ (só as 4 respostas aprovadas; copy do despacho) ───
// ⏳ GATED (não publicar sem confirmação):
//   • "Preciso de eletricista pra instalar?" — depende da instalação NI (decisão 4).
//   • "Tem garantia?" — depende dos termos de compra (decisão 3).
const FAQ: readonly { pergunta: string; resposta: string }[] = [
  {
    pergunta: 'Meu no-break já não protege isso?',
    resposta:
      'No-break segura QUEDA de energia. O transiente de alta frequência passa por cima dele — é outra ameaça.',
  },
  {
    pergunta: 'Qual a diferença pro DPS que eu compro em loja?',
    resposta:
      'O DPS de loja atua até 10 kHz e se sacrifica; o Master Block filtra em 100 kHz e continua protegendo.',
  },
  {
    pergunta: 'Como eu compro?',
    resposta:
      'Pela calculadora: informe a corrente, veja o modelo e o preço, e finalize a compra direta.',
  },
  {
    pergunta: 'Serve pra minha casa / meu comércio?',
    resposta: 'Sim. Há modelo do pequeno ao grande — a calculadora aponta o seu.',
  },
];

// CTA de WhatsApp (CTWA do motor NI) — reusa a infra comercial existente,
// sem redesenhar roteamento de funil; o contexto identifica a landing.
function ZapCta({ href, external, className }: { href: string; external: boolean; className: string }) {
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      Falar no WhatsApp
    </a>
  ) : (
    <Link href={href} className={className}>
      Falar no WhatsApp
    </Link>
  );
}

export default async function ProtecaoPage() {
  const config = await getWhatsAppButtonConfig();
  const zapHref = buildCommercialCtaHref(config, {
    context: 'Proteção NI (landing /protecao)',
    fallbackPath: '/contato',
  });
  const zapExternal = isExternalCtaHref(zapHref);
  const precoBase = formatBRL(MASTER_BLOCK_MODELS[0].preco);

  return (
    <>
      {/* ── 1. HERO (âncora navy) ─────────────────────────────────── */}
      <section
        className="relative isolate flex min-h-[72svh] items-center overflow-hidden bg-deep_navy pt-20 text-white"
        aria-label="Proteção para casa, comércio e condomínio"
      >
        {/* Foto full-bleed — ⏳ foto nova do Estúdio; placeholder até chegar */}
        <div className="absolute inset-0 -z-20" aria-hidden="true">
          <div
            className="flex h-full w-full items-end p-8"
            style={{
              background:
                'linear-gradient(135deg, rgb(13,41,73) 0%, rgb(7,27,51) 60%, rgb(3,17,31) 100%)',
            }}
          >
            <span className="font-serif text-4xl font-bold tracking-tight text-white/10 md:text-6xl">
              Casa · Comércio · Condomínio
            </span>
          </div>
        </div>
        {/* Scrim — denso do lado do texto (regra de marca) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,12,22,0.8)_0%,rgba(1,12,22,0.55)_38%,rgba(1,12,22,0.15)_70%,rgba(1,12,22,0.02)_100%)]"
        />

        <div className="container-msm w-full py-14 md:py-20">
          <div className="max-w-[680px] space-y-5">
            <h1 className="font-serif text-[2rem] leading-[1.1] font-semibold text-balance sm:text-[2.5rem] lg:text-[3rem] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
              A mesma proteção das maiores indústrias do Brasil — agora para o
              seu negócio e a sua casa.
            </h1>
            <p className="max-w-[560px] text-base leading-relaxed text-white/90 text-pretty md:text-lg">
              Surto e transiente não queimam só máquina de fábrica. Queimam o
              freezer do comércio, a automação da casa, o elevador do condomínio
              e o carregador do carro elétrico. O Master Block protege onde o
              DPS comum não alcança.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={CALC_HREF} className="btn-primary group">
                Descobrir o meu Master Block
                <ChevronRight
                  className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
              <ZapCta href={zapHref} external={zapExternal} className="inline-flex items-center rounded-btn border border-white/40 px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:border-gold hover:text-gold" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. O PROBLEMA (claro) ─────────────────────────────────── */}
      <div className="tone-surface">
        <section className="container-msm section-y" aria-label="O problema">
          <Reveal className="max-w-3xl mx-auto space-y-5 text-center">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Não precisa cair um raio no seu telhado.
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
              Basta a rede oscilar — um religamento da concessionária, um pico
              da vizinhança, uma tempestade a quilômetros dali. Esse transiente
              de alta frequência passa direto pelo disjuntor, pelo no-break e
              pelo DPS de loja, e chega nos seus equipamentos. É ele que{' '}
              <span className="font-semibold text-gold">queima placa &ldquo;do nada&rdquo;</span>.
            </p>
          </Reveal>
        </section>
      </div>

      {/* ── 3. PRA QUEM É (off-white) — grade 3+2 ─────────────────── */}
      <div className="tone-base">
        <section className="container-msm section-y" aria-label="Para quem é">
          <Reveal className="max-w-3xl space-y-4 mb-10">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Feito pra proteger o que você tem na tomada
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {PUBLICOS.map(({ Icon, nome, risco, foto, alt }, i) => (
              <Reveal
                key={nome}
                delay={i * 60}
                className={`card-elevated flex h-full flex-col overflow-hidden ${
                  i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-navy-700">
                  {foto ? (
                    <Image
                      src={foto}
                      alt={alt}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    /* ⏳ foto nova do Estúdio — placeholder no mesmo slot */
                    <div
                      className="flex h-full w-full items-end p-5"
                      style={{
                        background:
                          'linear-gradient(135deg, rgb(13,41,73) 0%, rgb(7,27,51) 60%, rgb(3,17,31) 100%)',
                      }}
                      aria-hidden="true"
                    >
                      <span className="font-serif text-2xl font-bold tracking-tight text-white/10">
                        {nome}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-cyan/15 text-cyan">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <h3 className="font-sans font-semibold text-base text-[rgb(var(--text))]">
                      {nome}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{risco}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* ── 4. POR QUE O MASTER BLOCK (âncora navy) ───────────────── */}
      <section className="band-navy text-white" aria-label="Por que o Master Block">
        <div className="container-msm section-y">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <Reveal className="space-y-4 lg:col-span-5">
              <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
                O que a loja te vende não é a mesma coisa.
              </h2>
              <p className="leading-relaxed text-white/85">
                O DPS de prateleira atua até 10 kHz e se sacrifica no primeiro
                surto grande — depois disso você fica desprotegido e nem
                percebe. O Master Block é um filtro que age em{' '}
                <span className="font-semibold text-gold">100 kHz</span>, na
                frequência onde o dano acontece, e continua protegendo surto
                após surto. É a tecnologia das maiores indústrias do Brasil, no
                tamanho certo para você.
              </p>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-7">
              {/* Mini-versão do gráfico 10 × 100 kHz da home (reaproveitado) */}
              <div className="rounded-card-lg border border-white/10 bg-[rgb(var(--surface))] p-5 text-[rgb(var(--text))] md:p-7">
                <FrequencySpectrum />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 5. DESCUBRA + PREÇO (claro) — núcleo de conversão ─────── */}
      <div className="tone-surface">
        <section id="calculadora" className="container-msm section-y" aria-label="Calculadora">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Descubra o Master Block ideal — e o preço — em 2 minutos.
            </h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed">
              Sem orçamento, sem esperar vendedor. Você informa a corrente do
              seu quadro e a calculadora mostra o modelo certo e o valor na
              hora.
            </p>
            <p className="font-sans text-lg font-bold text-gold">
              A partir de {precoBase} · compra direta.
            </p>
          </Reveal>
          {/* Calculadora EMBUTIDA (encurta o funil) — já captura o lead pro
              Betinna com atribuição; reusada, não refeita. */}
          <Reveal delay={100} className="mt-8">
            <MasterBlockSelector
              sourcePage="/protecao"
              ctaLabel="Pedir meu orçamento"
            />
          </Reveal>
        </section>
      </div>

      {/* ── 6. PROVA (âncora navy) ────────────────────────────────── */}
      <section className="band-navy text-white" aria-label="Prova social">
        <div className="container-msm section-y space-y-8">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Se protege as maiores indústrias do país, protege o seu.
            </h2>
          </Reveal>
          <Reveal>
            <ProofBadges variant="dark" />
          </Reveal>
          <Reveal className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(var(--gold-soft))]" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-sm leading-relaxed text-white/75">
              Entre os clientes atendidos:{' '}
              <span className="font-semibold text-white">
                BASF, Akzo Nobel / Tintas Coral, Acrilex, Nissin Foods, Cinpal
              </span>{' '}
              e outras indústrias de referência. A engenharia é a mesma — muda
              só o porte.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 7. COMPRA COM SEGURANÇA (off-white) — ⏳ GATE ──────────── */}
      {TERMOS_COMPRA && (
        <div className="tone-base">
          <section className="container-msm section-y" aria-label="Compra com segurança">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {TERMOS_COMPRA.map((t) => (
                <div key={t.titulo} className="card-elevated p-6">
                  <h3 className="font-sans font-semibold text-base">{t.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                    {t.texto}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── 8. FAQ (claro) ────────────────────────────────────────── */}
      <div className="tone-surface">
        <section className="container-msm section-y" aria-label="Perguntas frequentes">
          <Reveal className="max-w-3xl space-y-4 mb-10">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Perguntas frequentes
            </h2>
          </Reveal>
          <div className="mx-auto max-w-3xl space-y-6">
            {FAQ.map((f, i) => (
              <Reveal key={f.pergunta} delay={i * 60} className="rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-6">
                <h3 className="font-sans font-semibold text-base text-[rgb(var(--text))]">
                  {f.pergunta}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                  {f.resposta}
                </p>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* ── 9. CTA FINAL (bookend escuro) ─────────────────────────── */}
      <section className="band-navy-end text-white" aria-label="Chamada final">
        <div className="container-msm section-y-lg">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Proteja o que está na tomada.
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={CALC_HREF} className="btn-primary group">
                Descobrir o meu Master Block
                <ChevronRight
                  className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
              <ZapCta href={zapHref} external={zapExternal} className="inline-flex items-center rounded-btn border border-white/40 px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:border-gold hover:text-gold" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
