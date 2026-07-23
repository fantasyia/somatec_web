'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { HERO_FALLBACK } from '@/lib/constants/home-fallback';
import type { HomeHero as HeroData } from '@/types/database';

/**
 * Hero em TELA CHEIA (despacho #7): a primeira tela contém só cabeçalho
 * (transparente, sobreposto) + este carrossel full-bleed + a faixa de logos
 * ancorada na base — o wrapper de 100svh vive no page.tsx. A tese fixa deixou
 * de existir como bloco separado: ela É o slide 1.
 *
 * Legibilidade (regra de marca): todo slide tem scrim — gradiente escuro mais
 * denso do lado do texto + reforço na base (onde ficam texto mobile e a barra
 * de progresso).
 *
 * Fotos do Estúdio em 3 formatos por slide (despacho #8): wide 2048x1024 ·
 * tablet 1024x1192 · tall 832x1536, servidas via <picture> por breakpoint.
 */

type Props = { data: HeroData | null };

type Slide = {
  id: string;
  title: string;
  subtitle?: string;
  /** Texto de apoio menor (slide 1 = conteúdo "MasterBlock + software"). */
  apoio?: string;
  ctas: { label: string; href: string; primary?: boolean }[];
  /** Art direction (despacho #8): wide ≥1024 · tablet 768–1023 · tall <768. */
  images: { wide: string; tablet: string; tall: string };
  alt: string;
  /** 'cold' = scrim neutro-escuro frio (S2b é âmbar — devolve contraste ao CTA laranja). */
  scrim?: 'cold';
};

const DURATION_MS = 7000;

export function HomeHero({ data }: Props) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const paused = hovered || focused;
  const resumeFromRef = useRef(0);

  // Slide 1 carrega a TESE — título/subtítulo/CTAs seguem editáveis pelo
  // admin (home_hero); fallback = copy oficial do despacho.
  const slides: Slide[] = [
    {
      id: 'tese',
      title: data?.title ?? HERO_FALLBACK.title,
      subtitle: data?.description ?? data?.subtitle ?? HERO_FALLBACK.subtitle,
      apoio:
        'MasterBlock + software de qualidade de energia: o filtro híbrido age em 100 kHz, e o software de gestão on-line mede antes e depois, comprovando a proteção em dados.',
      ctas: [
        {
          label: data?.primary_cta_label ?? HERO_FALLBACK.primary.label,
          href: data?.primary_cta_url ?? HERO_FALLBACK.primary.href,
          primary: true,
        },
        {
          label: data?.secondary_cta_label ?? HERO_FALLBACK.secondary.label,
          href: data?.secondary_cta_url ?? HERO_FALLBACK.secondary.href,
        },
      ],
      images: {
        wide: '/home/hero/hero-s1-wide.webp',
        tablet: '/home/hero/hero-s1-tablet.webp',
        tall: '/home/hero/hero-s1-tall.webp',
      },
      alt: 'Painel elétrico industrial aberto com disjuntores e fiação',
    },
    {
      id: 'cascata',
      title: 'Proteção em cascata',
      subtitle:
        'Master Block na entrada, no quadro e junto ao equipamento crítico, atenuando o surto em etapas.',
      ctas: [{ label: 'Ver como funciona', href: '/solucoes/protecao-contra-surtos', primary: true }],
      images: {
        wide: '/home/hero/hero-s2b-wide.webp',
        tablet: '/home/hero/hero-s2b-tablet.webp',
        tall: '/home/hero/hero-s2b-tall.webp',
      },
      alt: 'Linha de produção industrial com painel de proteção em primeiro plano',
      scrim: 'cold',
    },
    {
      id: 'nao-industrial',
      title: 'Proteção também pra comércio, condomínio e casa de alto padrão',
      subtitle:
        'O mesmo que blinda a indústria protege freezer e PDV do comércio, bombas e elevador do condomínio, automação e painel solar da casa de alto padrão.',
      // /protecao é o HUB único do NI — deep-link na âncora da calculadora
      // embutida mantém o verbo "calcular" com o clique de alta intenção.
      ctas: [{ label: 'Calcular a minha proteção', href: '/protecao#calculadora', primary: true }],
      images: {
        wide: '/home/hero/hero-s3-wide.webp',
        tablet: '/home/hero/hero-s3-tablet.webp',
        tall: '/home/hero/hero-s3-tall.webp',
      },
      alt: 'Sala de estar de alto padrão com automação e home theater',
    },
  ];

  // Realça o contraste de frequência: "100 kHz" laranja, "10 kHz" riscado.
  const renderRich = (t: string) =>
    t.split(/(100 kHz|10 kHz)/g).map((p, i) => {
      if (p === '100 kHz') return <span key={i} className="text-gold">100 kHz</span>;
      if (p === '10 kHz')
        return (
          <span key={i} className="line-through decoration-2 decoration-gold/50 opacity-70">
            10 kHz
          </span>
        );
      return p;
    });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicializar a partir do matchMedia no mount
    setReduceMotion(mql.matches);
    const cb = () => setReduceMotion(mql.matches);
    mql.addEventListener('change', cb);
    return () => mql.removeEventListener('change', cb);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset da barra ao trocar slide
    setProgress(0);
    resumeFromRef.current = 0;
  }, [index]);

  // Auto-avanço 7s + barra de progresso (retoma do ponto pausado).
  useEffect(() => {
    if (reduceMotion || paused) return;

    const startProgress = resumeFromRef.current;
    const elapsedFromProgress = (startProgress / 100) * DURATION_MS;
    const startTime = Date.now() - elapsedFromProgress;

    let rafId = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(pct);
      resumeFromRef.current = pct;
      if (pct < 100) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const timeRemaining = Math.max(0, DURATION_MS - elapsedFromProgress);
    const tid = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, timeRemaining);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tid);
    };
  }, [index, paused, reduceMotion, slides.length]);

  const goTo = (i: number) => setIndex(((i % slides.length) + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Destaques Somatec Blocking"
      data-hero-slide-area
      className="relative flex-1 overflow-hidden bg-deep_navy text-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      // Setas navegam; nada de focus trap — Tab segue o fluxo normal.
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') goTo(index + 1);
        if (e.key === 'ArrowLeft') goTo(index - 1);
      }}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          inert={i !== index}
          aria-hidden={i !== index}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${i + 1} de ${slides.length}: ${slide.title}`}
          className={`absolute inset-0 transition-opacity duration-[700ms] ease-premium ${
            i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Foto full-bleed com art direction (despacho #8): wide ≥1024,
              tablet 768–1023, tall <768. next/image não faz <picture> com
              media queries — assets já vêm otimizados em webp do build. */}
          <picture>
            <source media="(min-width: 1024px)" srcSet={slide.images.wide} />
            <source media="(min-width: 768px)" srcSet={slide.images.tablet} />
            <img
              src={slide.images.tall}
              alt={slide.alt}
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority={i === 0 ? 'high' : undefined}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </picture>

          {/* Scrim (regra de marca): denso do lado do texto + reforço na base.
              S2b (âmbar quente) usa a variante FRIA neutro-escura — laranja
              sobre âmbar mata o CTA; o frio devolve o contraste. */}
          <div
            aria-hidden="true"
            className={
              slide.scrim === 'cold'
                ? 'absolute inset-0 bg-[linear-gradient(90deg,rgba(9,13,18,0.93)_0%,rgba(9,13,18,0.74)_36%,rgba(9,13,18,0.32)_64%,rgba(9,13,18,0.06)_100%)]'
                : 'absolute inset-0 bg-[linear-gradient(90deg,rgba(1,12,22,0.86)_0%,rgba(1,12,22,0.62)_34%,rgba(1,12,22,0.24)_62%,rgba(1,12,22,0.05)_100%)]'
            }
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
          />

          {/* Conteúdo sobre a imagem — pt compensa o cabeçalho sobreposto */}
          <div className="relative flex h-full items-center">
            <div className="container-msm w-full pt-24 pb-16">
              <div className="max-w-[640px] space-y-4">
                {i === 0 ? (
                  <h1 className="font-serif text-[2rem] leading-[1.08] sm:text-[2.5rem] lg:text-[3.15rem] font-semibold text-balance [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
                    {renderRich(slide.title)}
                  </h1>
                ) : (
                  <h2 className="font-serif text-[2rem] leading-[1.08] sm:text-[2.5rem] lg:text-[3.15rem] font-semibold text-balance [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
                    {renderRich(slide.title)}
                  </h2>
                )}
                {slide.subtitle && (
                  <p className="max-w-[520px] text-base leading-relaxed text-white/90 text-pretty md:text-lg [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
                    {renderRich(slide.subtitle)}
                  </p>
                )}
                {slide.apoio && (
                  <p className="hidden max-w-[520px] text-sm leading-relaxed text-white/65 text-pretty md:block">
                    {slide.apoio}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {slide.ctas.map((cta) =>
                    cta.primary ? (
                      <Link key={cta.href} href={cta.href} className="btn-primary group">
                        {cta.label}
                        <ChevronRight
                          className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                          strokeWidth={2}
                        />
                      </Link>
                    ) : (
                      <Link
                        key={cta.href}
                        href={cta.href}
                        className="inline-flex items-center rounded-btn border border-white/40 px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:border-gold hover:text-gold"
                      >
                        {cta.label}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Barra de progresso segmentada — base do carrossel, sobre o scrim */}
      <div className="absolute inset-x-0 bottom-0">
        <div
          className="container-msm grid gap-1.5 pb-5"
          style={{ gridTemplateColumns: `repeat(${slides.length}, 1fr)` }}
          role="tablist"
          aria-label="Selecionar slide"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}: ${slide.title}`}
              onClick={() => goTo(i)}
              className="group relative h-1 overflow-hidden rounded-full bg-white/25"
            >
              <span
                className="absolute inset-y-0 left-0 bg-gold transition-[width]"
                style={{
                  width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                  transitionDuration: i === index ? '0ms' : '300ms',
                }}
                aria-hidden="true"
              />
              <span className="sr-only">Ir para slide {i + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
