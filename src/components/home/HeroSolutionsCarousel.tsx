'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/**
 * Carrossel de 3 slides DENTRO do hero (despacho #4): a tese fica fixa à
 * esquerda; aqui giram as três portas de entrada (solução / sistema / NI).
 * Absorve o antigo carrossel de soluções que ficava abaixo do hero.
 * Auto-avanço 7s, pausa em hover/focus, respeita prefers-reduced-motion.
 */

type HeroSlide = {
  id: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  /** null = placeholder (foto do Estúdio ainda em produção). */
  image: string | null;
};

const SLIDES: readonly HeroSlide[] = [
  {
    id: 'solucao',
    title: 'MasterBlock + software de qualidade de energia',
    text: 'O filtro híbrido age em 100 kHz, onde o DPS comum não chega — e o software de gestão on-line mede antes e depois, comprovando a proteção em dados.',
    cta: { label: 'Conheça a solução', href: '/produtos' },
    image: '/home/sol-masterblock.webp',
  },
  {
    id: 'sistema',
    title: 'Proteção em cascata',
    text: 'Master Block na entrada, no quadro e junto ao equipamento crítico, atenuando o surto em etapas.',
    cta: { label: 'Ver como funciona', href: '/solucoes/protecao-contra-surtos' },
    image: '/home/sol-cascata.webp',
  },
  {
    id: 'nao-industrial',
    title: 'Proteção também pra comércio, condomínio e casa de alto padrão',
    text: 'O mesmo que blinda a indústria protege freezer e PDV do comércio, bombas e elevador do condomínio, automação e painel solar da casa de alto padrão.',
    cta: { label: 'Calcular a minha proteção', href: '/ferramentas/orcamento' },
    image: null,
  },
];

const DURATION_MS = 7000;

export function HeroSolutionsCarousel() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const paused = hovered || focused;
  const resumeFromRef = useRef(0);

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

  // Timer + barra de progresso (retoma do ponto pausado — mesmo padrão do
  // antigo HomeCarousel).
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
      setIndex((i) => (i + 1) % SLIDES.length);
    }, timeRemaining);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tid);
    };
  }, [index, paused, reduceMotion]);

  return (
    <div
      aria-roledescription="carousel"
      aria-label="Portas de entrada da solução"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="relative overflow-hidden rounded-card-lg border border-white/15 bg-white/[0.06] shadow-premium-dark backdrop-blur-sm">
        {/* Slides — dual-render com fade/translate (inativos inert) */}
        <div className="relative">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              inert={i !== index}
              aria-hidden={i !== index}
              className={`${
                i === index
                  ? 'relative opacity-100 translate-x-0'
                  : 'absolute inset-0 opacity-0 translate-x-5 pointer-events-none'
              } transition-all duration-[600ms] ease-premium`}
            >
              {/* Foto 16:9 (slide NI: placeholder até o Estúdio gerar) */}
              <div className="relative aspect-video w-full overflow-hidden bg-navy-700">
                {slide.image ? (
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={i === 0}
                    sizes="(min-width: 1024px) 540px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-end p-6"
                    style={{
                      background:
                        'linear-gradient(135deg, rgb(13,41,73) 0%, rgb(7,27,51) 60%, rgb(3,17,31) 100%)',
                    }}
                    aria-hidden="true"
                  >
                    <span className="font-serif text-3xl font-bold tracking-tight text-white/10">
                      Comércio · Condomínio · Residência
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 p-5 md:p-6">
                <h2 className="font-serif text-lg font-semibold leading-snug text-white text-balance md:text-xl">
                  {slide.title}
                </h2>
                <p className="text-sm leading-relaxed text-white/70 text-pretty">
                  {slide.text}
                </p>
                <Link
                  href={slide.cta.href}
                  className="group inline-flex items-center gap-1.5 pt-1 font-sans text-sm font-semibold text-gold transition-colors hover:text-gold-soft"
                >
                  {slide.cta.label}
                  <ChevronRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de progresso segmentada (padrão do site — não dots) */}
      <div
        className="mt-4 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${SLIDES.length}, 1fr)` }}
        role="tablist"
        aria-label="Selecionar slide"
      >
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}: ${slide.title}`}
            onClick={() => setIndex(i)}
            className="group relative h-0.5 overflow-hidden bg-white/20"
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
  );
}
