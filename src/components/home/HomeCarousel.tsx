'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SLIDER_FALLBACK } from '@/lib/constants/home-fallback';
import type { HomeSliderItem } from '@/types/database';

type Slide = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  image_url?: string | null;
  cta?: { label: string; href: string };
  transition_seconds: number;
};

function normalize(items: HomeSliderItem[] | null | undefined): Slide[] {
  if (items && items.length > 0) {
    return items.map((s) => ({
      id: s.id,
      title: s.title,
      eyebrow: s.subtitle ?? undefined,
      description: s.description ?? undefined,
      image_url: s.image_url,
      cta:
        s.cta_label && s.cta_url
          ? { label: s.cta_label, href: s.cta_url }
          : undefined,
      transition_seconds: s.transition_seconds,
    }));
  }
  return SLIDER_FALLBACK.map((s) => ({
    id: s.id,
    title: s.title,
    eyebrow: s.eyebrow,
    description: s.description,
    image_url: s.image_url,
    cta: s.cta,
    transition_seconds: 7,
  }));
}

type Props = { items: HomeSliderItem[] };

export function HomeCarousel({ items }: Props) {
  const slides = normalize(items);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [progress, setProgress] = useState(0);

  // Quando pausa: salva o progress; quando retoma: usa como startProgress.
  // Quando index muda: reseta para 0. Atualizado dentro do tick do useEffect
  // abaixo (evita escrita em ref durante render).
  const resumeFromRef = useRef(0);

  // Honra prefers-reduced-motion (subscribe a matchMedia no mount —
  // padrão legítimo de sincronização com browser API).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicializar a partir do matchMedia no mount
    setReduceMotion(mql.matches);
    const cb = () => setReduceMotion(mql.matches);
    mql.addEventListener('change', cb);
    return () => mql.removeEventListener('change', cb);
  }, []);

  const durationMs = (slides[index]?.transition_seconds ?? 7) * 1000;

  // Reset progress quando muda de slide (clique manual ou auto-advance)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset da barra ao trocar slide
    setProgress(0);
    resumeFromRef.current = 0;
  }, [index]);

  // Timer + progresso da barra (retoma do ponto pausado em vez de resetar)
  useEffect(() => {
    if (reduceMotion || paused || slides.length < 2) return;

    const startProgress = resumeFromRef.current;
    const elapsedFromProgress = (startProgress / 100) * durationMs;
    const startTime = Date.now() - elapsedFromProgress;

    let rafId = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      // Mantém o ref sincronizado com o último progress — usado no
      // cleanup pra retomar do mesmo ponto após pause/resume.
      resumeFromRef.current = pct;
      if (pct < 100) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const timeRemaining = Math.max(0, durationMs - elapsedFromProgress);
    const tid = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, timeRemaining);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tid);
      // resumeFromRef já foi atualizado pelo último tick; o reset para
      // 0 em mudança de slide é feito no useEffect com deps [index].
    };
  }, [index, paused, durationMs, slides.length, reduceMotion]);

  const goTo = (i: number) => setIndex(((i % slides.length) + slides.length) % slides.length);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  if (slides.length === 0) return null;

  const current = slides[index];

  return (
    <section
      className="bg-[rgb(var(--surface))] border-y border-[rgb(var(--border))]"
      aria-label="Destaques"
      aria-roledescription="carousel"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="relative container-msm py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* Image side (60%) — pausa o autoplay só com o mouse sobre a imagem */}
          <div
            className="md:col-span-7 relative aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-card-lg bg-navy-700 border border-[rgb(var(--border))]"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                aria-hidden={i !== index}
                className={`absolute inset-0 transition-all duration-[600ms] ease-premium ${
                  i === index
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-5'
                }`}
              >
                {slide.image_url ? (
                  <Image
                    src={slide.image_url}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, 60vw"
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-end p-8"
                    style={{
                      background:
                        'linear-gradient(135deg, rgb(13,41,73) 0%, rgb(7,27,51) 60%, rgb(3,17,31) 100%)',
                    }}
                  >
                    <span className="font-serif text-white/10 text-5xl md:text-7xl font-bold tracking-tight">
                      {slide.title}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Content side (40%) */}
          <div className="md:col-span-5 relative">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                inert={i !== index}
                aria-hidden={i !== index}
                className={`${
                  i === index
                    ? 'relative opacity-100 translate-x-0'
                    : 'absolute inset-0 opacity-0 translate-x-5 pointer-events-none'
                } transition-all duration-[600ms] ease-premium space-y-5`}
              >
                {/* h2: seção de topo da home (após o h1 do Hero) — não pular nível */}
                <h2 className="font-serif font-semibold text-h2-m md:text-h2-d text-balance">
                  {slide.title}
                </h2>
                {slide.description && (
                  <p className="text-base md:text-lg leading-relaxed text-[rgb(var(--text-muted))] text-pretty">
                    {slide.description}
                  </p>
                )}
                {slide.cta && (
                  <Link
                    href={slide.cta.href}
                    className="inline-flex items-center gap-1.5 mt-2 font-sans font-semibold text-sm text-gold hover:text-gold-soft transition-colors group"
                  >
                    {slide.cta.label}
                    <ChevronRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={2}
                    />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Setas (desktop) */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={prev}
              className="hidden md:flex absolute left-2 lg:-left-6 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text))] opacity-40 hover:opacity-100 hover:border-gold transition-all duration-200 ease-premium z-10"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={next}
              className="hidden md:flex absolute right-2 lg:-right-6 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text))] opacity-40 hover:opacity-100 hover:border-gold transition-all duration-200 ease-premium z-10"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </>
        )}

        {/* Progress bar — barra linear segmentada, NÃO dots */}
        {slides.length > 1 && (
          <div
            className="mt-10 grid gap-1.5"
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
                className="h-0.5 bg-[rgb(var(--border))] relative overflow-hidden group"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-gold transition-[width]"
                  style={{
                    width:
                      i < index
                        ? '100%'
                        : i === index
                          ? `${progress}%`
                          : '0%',
                    transitionDuration: i === index ? '0ms' : '300ms',
                  }}
                  aria-hidden="true"
                />
                <span className="sr-only">Ir para slide {i + 1}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
