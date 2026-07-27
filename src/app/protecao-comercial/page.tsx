import type { Metadata } from 'next';
import Image from 'next/image';
import {
  UtensilsCrossed,
  ShoppingCart,
  Pill,
  Wrench,
  Building2,
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
 * LP COMERCIAL (compra direta / self-service) — spec: lp-ni-spec.md (C1-C8).
 * Público: comércio, pequena indústria, condomínio.
 * 🔒 REGRA DE OURO: zero menção a locação/comodato/"paga só com resultado";
 * nenhum link pra trilha industrial. Só COMPRA DIRETA.
 */

const SLUG = 'protecao-comercial';

export const metadata: Metadata = {
  title: { absolute: 'Proteção elétrica para comércio — câmara fria, PDV e freezers | Master Block' },
  description:
    'Um surto derruba a câmara fria, o forno e o PDV de uma vez: estoque perdido + venda parada + conserto. Monte a proteção do seu negócio em minutos.',
  alternates: { canonical: `/${SLUG}` },
  robots: { index: process.env.SITE_NOINDEX !== 'true', follow: true },
};

export const revalidate = 3600;

// C2 — problema por segmento (o visitante se acha no dele)
const SEGMENTOS: readonly { Icon: LucideIcon; titulo: string; texto: string }[] = [
  { Icon: UtensilsCrossed, titulo: 'Padaria / restaurante', texto: 'Forno, câmara fria e PDV no mesmo quadro. Um surto = produção parada + estoque perdido + fila que vai embora.' },
  { Icon: ShoppingCart, titulo: 'Mercado / açougue', texto: 'Freezers e câmaras trabalham 24h. A placa queima de madrugada; você descobre pelo cheiro.' },
  { Icon: Pill, titulo: 'Farmácia', texto: 'Geladeira de medicamento tem lote que não volta — e vigilância sanitária não aceita "foi a energia".' },
  { Icon: Wrench, titulo: 'Oficina / pequena indústria', texto: 'Máquina com placa eletrônica parada = diária dos funcionários paga pra olhar pro teto.' },
  { Icon: Building2, titulo: 'Condomínio', texto: 'Quando a placa do elevador queima, a conta não estava na previsão — e a assembleia quer saber por quê.' },
];

// C7 — FAQ (core da R7 + 2 trocas comerciais)
const FAQ: readonly { pergunta: string; resposta: string }[] = [
  { pergunta: 'Meu negócio pode parar durante a instalação?', resposta: 'A instalação é rápida e programada pelo seu eletricista — dá pra fazer fora do horário de movimento.' },
  { pergunta: 'Sou MEI/pequeno — isso é pra mim?', resposta: 'O modelo é dimensionado pelo seu quadro, não pelo seu porte. Se o seu faturamento depende de equipamento ligado, é pra você.' },
  { pergunta: 'Já tenho DPS e estabilizador. Não basta?', resposta: 'Eles pegam uma parte. As variações mais rápidas — as que queimam placa e travam máquina — passam por eles. O Master Block existe pra essa camada.' },
  { pergunta: 'E se eu não souber tensão/corrente?', resposta: 'Toca em "não sei", manda uma foto do quadro e a gente dimensiona.' },
  { pergunta: 'E se não funcionar?', resposta: 'Garantia de 3 anos, e você fala com gente — WhatsApp direto, sem robô de 0800.' },
];

export default async function ProtecaoComercialPage() {
  const config = await getWhatsAppButtonConfig();
  const zapHref = buildCommercialCtaHref(config, {
    context: 'LP Comercial (/protecao-comercial)',
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

      {/* ── C1 · HERO (navy sobre imagem) ─────────────────────────── */}
      <section
        className="relative isolate flex min-h-[76svh] items-center overflow-hidden bg-deep_navy pt-20 text-white"
        aria-label="Proteção elétrica para comércio"
      >
        <div className="absolute inset-0 -z-20" aria-hidden="true">
          <img
            src="/home/hero-s2-comercio-v3.webp"
            srcSet="/home/hero-s2-comercio-v3-480.webp 480w, /home/hero-s2-comercio-v3-768.webp 768w, /home/hero-s2-comercio-v3-1200.webp 1200w, /home/hero-s2-comercio-v3.webp 1920w"
            sizes="100vw"
            alt="Atendente de padaria entregando o pão a uma cliente, com a vitrine e o forno ao fundo"
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center 42%' }}
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,13,18,0.9)_0%,rgba(9,13,18,0.66)_38%,rgba(9,13,18,0.24)_70%,rgba(9,13,18,0.04)_100%)]"
        />
        <div className="container-msm w-full py-14 md:py-20">
          <div className="max-w-[680px] space-y-5">
            <h1 className="font-serif text-[2rem] leading-[1.1] font-semibold text-balance sm:text-[2.5rem] lg:text-[3rem] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
              Quando a energia falha, seu negócio perde três vezes.
            </h1>
            <p className="max-w-[560px] text-base leading-relaxed text-white/90 text-pretty md:text-lg">
              O estoque da câmara fria. A venda que parou no PDV. E o conserto que não estava no
              orçamento. Tudo no mesmo dia — e a conta de luz chega igual.
            </p>
            <div className="pt-2">
              <LpCta label="Proteger meu negócio" event="hero_cta" setor="comercial" landing={SLUG} />
            </div>
            <p className="text-sm text-white/70">orçamento em 2 minutos · sem vendedor no seu pé</p>
          </div>
        </div>
      </section>

      {/* ── C2 · O PROBLEMA POR SEGMENTO (branco) ─────────────────── */}
      <div className="tone-surface">
        <section className="container-msm section-y" aria-label="Onde o surto pega o seu negócio">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Onde o surto pega o seu negócio
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SEGMENTOS.map(({ Icon, titulo, texto }, i) => (
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
              O DPS e o estabilizador que você já tem{' '}
              <span className="font-semibold text-gold">não seguram</span> as variações mais rápidas
              da rede — as que queimam placa e travam máquina.
            </p>
          </Reveal>
        </section>
      </div>

      {/* ── C3 · A SOLUÇÃO + autoridade (off-white) ───────────────── */}
      <div className="tone-base">
        <section className="container-msm section-y" aria-label="A solução">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <Reveal className="space-y-5 lg:col-span-7">
              <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
                A mesma proteção das grandes indústrias, dimensionada pro seu negócio.
              </h2>
              <p className="leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
                O Master Block protege há 26 anos fábricas onde 40 minutos de parada custam caro
                demais pra arriscar. É o mesmo bloqueador, dimensionado pro quadro do seu negócio,
                instalado pelo seu eletricista, com manual e suporte.
              </p>
              <ul className="space-y-2.5">
                {['26 anos sem um acidente', 'Patenteado, fabricação exclusiva no Brasil', 'Garantia de 3 anos (+1 com depoimento)'].map((b) => (
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

      {/* ── C4 · CASCATA COMERCIAL (navy) ─────────────────────────── */}
      <section className="band-navy text-white" aria-label="Proteção em cascata">
        <div className="container-msm section-y space-y-8">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Um quadro protegido não salva o negócio inteiro
            </h2>
            <p className="leading-relaxed text-white/85 text-pretty">
              Comércio quase sempre tem mais de um quadro: entrada, câmara fria, ar-condicionado,
              PDV/servidores. Proteção que funciona é{' '}
              <span className="font-semibold text-gold">em cascata</span> — um Master Block robusto na
              entrada + um menor em cada quadro que sustenta o seu faturamento. É o que separa
              &ldquo;protegi a instalação&rdquo; de &ldquo;protegi o negócio&rdquo;.
            </p>
          </Reveal>
          <Reveal className="rounded-card-lg border border-white/10 bg-white/[0.03] p-6 md:p-10">
            <CascataDiagram
              setor="comercial"
              titulo="Diagrama de proteção em cascata do comércio: entrada, câmara fria, PDV e ar-condicionado"
              entradaLabel="Quadro de entrada"
            />
          </Reveal>
          <Reveal>
            <LpCta
              label="Ver o que eu precisaria"
              event="cascata_cta"
              setor="comercial"
              landing={SLUG}
              variant="ghostDark"
            />
          </Reveal>
        </div>
      </section>

      {/* ── C5 · CONTA DA PERDA (branco) — sem número inventado ────── */}
      <div className="tone-surface">
        <section className="container-msm section-y" aria-label="A conta da perda">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Faça a conta que ninguém quer fazer
            </h2>
            <p className="leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
              Some o valor do estoque da câmara + o que o caixa fatura numa tarde + o orçamento de
              troca de uma placa eletrônica. Esse é o tamanho do risco que fica ligado na tomada todos
              os dias. A proteção custa{' '}
              <span className="font-semibold text-gold">uma fração disso</span> — e é uma vez só.
            </p>
          </Reveal>
        </section>
      </div>

      {/* ── C6 · CALCULADORA (off-white) ⭐ ───────────────────────── */}
      <div className="tone-base">
        <section className="container-msm section-y" aria-label="Monte a proteção do seu negócio">
          <Reveal className="max-w-3xl space-y-4">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Monte a proteção do seu negócio agora
            </h2>
            <p className="text-[rgb(var(--text-muted))] leading-relaxed text-pretty">
              Poucas perguntas. Não sabe a corrente do disjuntor? Manda uma foto do quadro que a
              gente resolve.
            </p>
          </Reveal>
          <Reveal delay={100} className="mt-8">
            <CheckoutNI
              setor="comercial"
              landingSlug={SLUG}
              whatsappHref={zapHref}
              whatsappExternal={zapExternal}
            />
          </Reveal>
        </section>
      </div>

      {/* ── C7 · CONFIANÇA + FAQ (branco) ─────────────────────────── */}
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

      {/* ── C7.5 · BLOG DO PÚBLICO ────────────────────────────────── */}
      <BlogDoPublico
        publico="comercial"
        titulo="Para ler antes de decidir"
        subtitulo="Artigos sobre proteção elétrica no comércio — câmara fria, PDV, elevador de condomínio e o que o DPS do quadro não resolve."
      />

      {/* ── C8 · CTA FINAL (navy) ─────────────────────────────────── */}
      <section className="band-navy-end text-white" aria-label="Chamada final">
        <div className="container-msm section-y-lg">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <h2 className="font-serif text-h2-m md:text-h2-d font-semibold text-balance">
              Seu concorrente não vai parar de vender quando a rede oscilar. Você também não precisa.
            </h2>
            <div className="flex justify-center">
              <LpCta label="Proteger meu negócio" event="final_cta" setor="comercial" landing={SLUG} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
