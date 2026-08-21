import type { Metadata } from 'next';
import Image from 'next/image';
import {
  Cpu,
  Sun,
  Car,
  Wind,
  Waves,
  Cctv,
  BadgeCheck,
} from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { ProofBadges } from '@/components/ui/ProofBadges';
import { CheckoutNI } from '@/components/tools/CheckoutNI';
import { CascataDiagram } from '@/components/lp/CascataDiagram';
import { BlogDoPublico } from '@/components/lp/BlogDoPublico';
import { LpCta } from '@/components/lp/LpCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { masterBlockProductSchema } from '@/lib/seo/structured-data';
import {
  buildCommercialCtaHref,
  getWhatsAppButtonConfig,
  isExternalCtaHref,
} from '@/lib/whatsapp-button';
import type { LucideIcon } from 'lucide-react';

/**
 * LP RESIDENCIAL (compra direta / self-service) — spec: lp-ni-spec.md (R1-R8).
 * 🔒 REGRA DE OURO: zero menção a locação/comodato/"paga só com resultado";
 * nenhum link pra trilha industrial. Só COMPRA DIRETA.
 */

const SLUG = 'protecao-residencial';

export const metadata: Metadata = {
  title: { absolute: 'Proteção contra surtos para casa de alto padrão | Master Block' },
  description:
    'Automação, home theater, inversor solar e carro elétrico na mesma rede. Basta um pico de energia para levar tudo junto. Monte sua proteção em minutos, sem precisar de vendedor.',
  alternates: { canonical: `/${SLUG}` },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export const revalidate = 3600;

// R2 — 6 problemas (ícone + dor concreta, sem jargão)
const PROBLEMAS: readonly { Icon: LucideIcon; titulo: string; texto: string }[] = [
  { Icon: Cpu, titulo: 'Automação e home theater', texto: 'A central trava, a cena não liga, e o conserto é importado.' },
  { Icon: Sun, titulo: 'Inversor solar', texto: 'O equipamento mais caro do telhado é também o mais sensível da casa.' },
  { Icon: Car, titulo: 'Carro elétrico', texto: 'O wallbox carrega de madrugada, ligado à rede por horas, sem ninguém vendo.' },
  { Icon: Wind, titulo: 'Ar-condicionado inverter', texto: 'A placa eletrônica queima calada; você descobre no primeiro dia de calor.' },
  { Icon: Waves, titulo: 'Piscina', texto: 'Bomba, aquecedor e trocador de calor vivem ligados. É o conserto mais esquecido da casa.' },
  { Icon: Cctv, titulo: 'Portão, CFTV e rede', texto: 'Quando queimam, a casa fica aberta e cega ao mesmo tempo.' },
];

// R7 — FAQ (copy do spec)
const FAQ: readonly { pergunta: string; resposta: string }[] = [
  { pergunta: 'Preciso de eletricista especial?', resposta: 'Não — qualquer eletricista de confiança instala com o manual. Suporte nosso à distância se ele quiser.' },
  { pergunta: 'O eletricista já instalou um DPS no meu quadro. Não basta?', resposta: 'O DPS pega uma parte. As oscilações mais rápidas — as que queimam placa — passam por ele. O Master Block existe pra essa camada.' },
  { pergunta: 'E se eu não souber tensão/corrente?', resposta: 'Toca em "não sei", manda uma foto do quadro e a gente dimensiona.' },
  { pergunta: 'Funciona com energia solar?', resposta: 'Sim — inversor solar é justamente um dos equipamentos que mais recomendamos proteger.' },
  { pergunta: 'O Master Block protege contra falta de fase?', resposta: 'Sim. Se uma das fases da rede cai, ele desliga o circuito para que os equipamentos não fiquem trabalhando com alimentação incompleta — é o que evita que o motor da bomba da piscina, do ar-condicionado central ou do portão queime por falta de fase. Quando a energia normaliza, ele religa sozinho, sem ninguém precisar ir até o quadro. Se cair de novo, o processo se repete. Já vem configurado assim, com manual.' },
  { pergunta: 'E se não funcionar?', resposta: 'Garantia de 3 anos, e você fala com gente — WhatsApp direto, sem robô de 0800.' },
];

export default async function ProtecaoResidencialPage() {
  const config = await getWhatsAppButtonConfig();
  const zapHref = buildCommercialCtaHref(config, {
    mensagem: 'Olá! Vim pelo site e quero proteger os equipamentos lá de casa.',
    fallbackPath: '/contato',
  });
  const zapExternal = isExternalCtaHref(zapHref);

  const faqSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: f.resposta },
    })),
  };

  return (
    <>
      <JsonLd data={[masterBlockProductSchema(), faqSchemaData]} />

      {/* ── R1 · HERO (navy sobre imagem) ─────────────────────────── */}
      <section
        className="relative isolate flex min-h-[min(76svh,max(520px,48vw))] items-center overflow-hidden bg-deep_navy pt-20 text-white"
        aria-label="Proteção para casa de alto padrão"
      >
        <div className="absolute inset-0 -z-20" aria-hidden="true">
          <img
            src="/home/hero-s3-family-v2.webp"
            srcSet="/home/hero-s3-family-v2-480.webp 480w, /home/hero-s3-family-v2-768.webp 768w, /home/hero-s3-family-v2-1200.webp 1200w, /home/hero-s3-family-v2.webp 1920w"
            sizes="100vw"
            alt="Família reunida no sofá da sala de estar, com a piscina iluminada pela janela"
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center' }}
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,12,22,0.86)_0%,rgba(1,12,22,0.6)_40%,rgba(1,12,22,0.18)_72%,rgba(1,12,22,0.03)_100%)]"
        />
        <div className="container-msm w-full py-14 md:py-20">
          <div className="max-w-[680px] space-y-5">
            <h1 className="font-serif text-[2rem] leading-[1.1] font-semibold text-balance sm:text-[2.5rem] lg:text-[3rem] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
              Sua casa nunca teve tanto patrimônio ligado na tomada.
            </h1>
            <p className="max-w-[560px] text-base leading-relaxed text-white/90 text-pretty md:text-lg">
              Automação, home theater, ar-condicionado, inversor solar — e o carro na garagem. Está
              tudo na mesma rede, e basta um pico de energia para levar tudo junto. O seguro cobre
              incêndio; ninguém te avisou sobre a energia.
            </p>
            <div className="pt-2">
              <LpCta label="Montar minha proteção" event="hero_cta" setor="residencial" landing={SLUG} />
            </div>
            <p className="text-sm text-white/70">
              2 minutos · sem vendedor · você só fala com alguém se quiser
            </p>
          </div>
        </div>
      </section>

      {/* ── R2 · O PROBLEMA (branco) ──────────────────────────────── */}
      <div className="tone-surface">
        <section className="container-msm section-y" aria-label="O problema">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              O que acontece dentro da sua casa quando a energia oscila
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMAS.map(({ Icon, titulo, texto }, i) => (
              <Reveal key={titulo} delay={i * 60} className="card-elevated flex flex-col gap-2 p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-btn bg-cyan/15 text-cyan">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="mt-1 font-sans font-semibold text-base text-[rgb(var(--text))]">{titulo}</h3>
                <p className="text-sm leading-relaxed text-[rgb(var(--text-muted))]">{texto}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mx-auto mt-10 max-w-3xl">
            <p className="text-base leading-relaxed text-[rgb(var(--text))] text-pretty">
              E o detalhe que ninguém conta: aquele dispositivo que o eletricista instalou no seu
              quadro (o DPS){' '}
              <span className="font-semibold text-gold">não pega</span> as oscilações mais rápidas —
              justamente as que queimam placa eletrônica.
            </p>
          </Reveal>
        </section>
      </div>

      {/* ── R3 · A SOLUÇÃO (off-white) ────────────────────────────── */}
      <div className="tone-base">
        <section className="container-msm section-y" aria-label="A solução">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <Reveal className="space-y-5 lg:col-span-7">
              <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
                A proteção de uma fábrica inteira — do tamanho de uma caixa no seu quadro.
              </h2>
              <p className="leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
                O Master Block é um equipamento brasileiro, patenteado, que há 26 anos
                protege linhas de produção onde uma placa queimada custa a fábrica parada. É uma
                caixa compacta instalada no seu quadro de energia —{' '}
                <span className="font-semibold text-[rgb(var(--text))]">pelo seu eletricista de confiança</span>,
                com manual e suporte.
              </p>
              <ul className="space-y-2.5">
                {['26 anos sem um acidente', 'Patenteado, fabricação exclusiva', 'Garantia de 3 anos (+1 ano com seu depoimento)'].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-[rgb(var(--text))]">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan" strokeWidth={1.75} aria-hidden="true" />
                    <span className="font-medium">{b}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-5">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card-lg border border-[rgb(var(--border))] shadow-premium">
                <Image
                  src="/home/hero-s1-mbwall.webp"
                  alt="Master Block instalado no quadro de energia"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      {/* ── R4 · CASCATA (navy — âncora) ──────────────────────────── */}
      <section className="band-navy text-white" aria-label="Proteção em cascata">
        <div className="container-msm section-y space-y-8">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Proteção em cascata: a casa inteira, não só a entrada
            </h2>
            <p className="leading-relaxed text-white/85 text-pretty">
              Proteger só o quadro de entrada é trancar a porta da frente e deixar a janela aberta.
              Casas de alto padrão têm quadros separados — casa de máquinas da piscina, ar-condicionado
              central, automação. A proteção certa é{' '}
              <span className="font-semibold text-gold">em cascata</span>: um Master Block mais robusto
              na entrada + um menor em cada quadro que alimenta algo caro.
            </p>
          </Reveal>
          <Reveal className="rounded-card-lg border border-white/10 bg-white/[0.03] p-6 md:p-10">
            <CascataDiagram
              setor="residencial"
              titulo="Diagrama de proteção em cascata da casa: entrada, piscina, ar-condicionado e automação"
              entradaLabel="Quadro de entrada"
            />
          </Reveal>
          <Reveal>
            <LpCta
              label="Ver quais quadros eu tenho"
              event="cascata_cta"
              setor="residencial"
              landing={SLUG}
              variant="ghostDark"
            />
          </Reveal>
        </div>
      </section>

      {/* ── R5 · CARRO ELÉTRICO (branco) ──────────────────────────── */}
      <div className="tone-surface">
        <section className="container-msm section-y" aria-label="Carro elétrico">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <Reveal className="space-y-4 lg:col-span-6">
              <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
                Tem carro elétrico? Então leia isto duas vezes.
              </h2>
              <p className="leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
                O wallbox e o sistema de carga do carro são eletrônicos caros ligados à rede{' '}
                <span className="font-semibold text-[rgb(var(--text))]">por horas, de madrugada, sem ninguém por perto</span>{' '}
                — exatamente o cenário onde um pico de energia age sem ninguém ver. E quem tem carro elétrico
                costuma ter inversor solar: dupla exposição, mesma rede. Um Master Block no circuito do
                carregador protege o conjunto.
              </p>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-6">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card-lg border border-[rgb(var(--border))] shadow-premium">
                <Image
                  src="/home/lp-ev-carregando.webp"
                  alt="Carro elétrico carregando na entrada de uma casa de alto padrão ao anoitecer"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      {/* ── R6 · CALCULADORA (off-white) ⭐ ───────────────────────── */}
      <div className="tone-base">
        <section className="container-msm section-y" aria-label="Monte sua proteção">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Monte sua proteção agora — sem precisar entender de elétrica
            </h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed text-pretty">
              Responda o básico; se não souber algo, toca em &ldquo;não sei&rdquo; e seguimos com uma
              foto do seu quadro. Ninguém trava aqui.
            </p>
          </Reveal>
          <Reveal delay={100} className="mt-8">
            <CheckoutNI
              setor="residencial"
              landingSlug={SLUG}
              whatsappHref={zapHref}
              whatsappExternal={zapExternal}
            />
          </Reveal>
        </section>
      </div>

      {/* ── R7 · CONFIANÇA + FAQ (branco) ─────────────────────────── */}
      <div className="tone-surface">
        <section className="container-msm section-y space-y-10" aria-label="Confiança e perguntas frequentes">
          <Reveal>
            <ProofBadges />
          </Reveal>
          <div>
            <Reveal className="max-w-3xl">
              <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
                Perguntas frequentes
              </h2>
            </Reveal>
            <div className="mx-auto mt-8 max-w-3xl space-y-5">
              {FAQ.map((f, i) => (
                <Reveal key={f.pergunta} delay={i * 50} className="rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-6">
                  <h3 className="font-sans font-semibold text-base text-[rgb(var(--text))]">{f.pergunta}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">{f.resposta}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── R7.5 · BLOG DO PÚBLICO ────────────────────────────────── */}
      <BlogDoPublico
        publico="residencial"
        titulo="Para ler antes de decidir"
        subtitulo="Artigos sobre proteção elétrica em casa — automação, inversor solar, carro elétrico e o que o DPS do quadro não resolve."
      />

      {/* ── R8 · CTA FINAL (navy) ─────────────────────────────────── */}
      <section className="band-navy-end text-white" aria-label="Chamada final">
        <div className="container-msm section-y-lg">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              A rede não avisa quando vai oscilar. Sua proteção pode estar montada em 2 minutos.
            </h2>
            <div className="flex justify-center">
              <LpCta label="Montar minha proteção" event="final_cta" setor="residencial" landing={SLUG} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
