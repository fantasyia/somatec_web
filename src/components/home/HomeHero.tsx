'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Pause, Play } from 'lucide-react';
import { HERO_FALLBACK } from '@/lib/constants/home-fallback';
import { HeroSolutionsCarousel } from '@/components/home/HeroSolutionsCarousel';
import type { HomeHero as HeroData } from '@/types/database';

type Props = { data: HeroData | null };

// Hero full-bleed: vídeo/imagem cobre a tela inteira, com o texto sobreposto.
// Imersivo — contrasta com o carrossel de molduras logo abaixo.
export function HomeHero({ data }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canLoadVideo, setCanLoadVideo] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      // play() pode rejeitar (autoplay bloqueado/NotAllowedError) — trata pra não
      // virar unhandled rejection. onPlay/onPause no <video> sincronizam isPlaying.
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }

  // Vídeo no mobile e no desktop. Só não dá autoplay se o usuário pediu
  // "reduzir movimento" no sistema. mql controla qual imagem-poster usar.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 768px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const decide = () => {
      setCanLoadVideo(!reduce.matches);
      setIsDesktop(mql.matches);
    };
    decide();
    mql.addEventListener('change', decide);
    reduce.addEventListener('change', decide);
    return () => {
      mql.removeEventListener('change', decide);
      reduce.removeEventListener('change', decide);
    };
  }, []);

  const title = data?.title ?? HERO_FALLBACK.title;
  // Realça o contraste de frequência: "100 kHz" (onde o Master Block atua) em
  // laranja, e "10 kHz" (limite do DPS comum) riscado/atenuado.
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
  const subtitle = data?.description ?? data?.subtitle ?? HERO_FALLBACK.subtitle;
  const primary = {
    label: data?.primary_cta_label ?? HERO_FALLBACK.primary.label,
    href: data?.primary_cta_url ?? HERO_FALLBACK.primary.href,
  };
  const secondary = {
    label: data?.secondary_cta_label ?? HERO_FALLBACK.secondary.label,
    href: data?.secondary_cta_url ?? HERO_FALLBACK.secondary.href,
  };

  const videoUrl = canLoadVideo ? (data?.video_url ?? HERO_FALLBACK.video_url ?? null) : null;
  // Poster / imagem de fundo: desktop usa a larga, mobile a vertical.
  const fallbackImage = isDesktop
    ? (data?.fallback_image_url ?? HERO_FALLBACK.fallback_image_url)
    : (data?.mobile_fallback_image_url ?? data?.fallback_image_url ?? HERO_FALLBACK.fallback_image_url);
  const overlayOpacity = data?.overlay_opacity ?? 0.55;

  return (
    <section
      className="relative isolate flex min-h-[76vh] items-center overflow-hidden bg-deep_navy pt-20 text-white"
      aria-label="Hero institucional"
    >
      {/* Fundo: vídeo / imagem / gradiente */}
      <div className="absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
        {fallbackImage ? (
          <Image src={fallbackImage} alt="" fill className="object-cover" priority sizes="100vw" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_30%_40%,rgba(13,41,73,0.95)_0%,rgba(3,17,31,1)_60%,rgba(3,17,31,1)_100%)]" />
        )}

        {videoUrl && (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-premium ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            src={videoUrl}
            poster={fallbackImage ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setVideoLoaded(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Overlay para legibilidade — âncora navy fixa (escuro nos dois temas) */}
      <div
        className="absolute inset-0 -z-10 block"
        aria-hidden="true"
        style={{
          background: `linear-gradient(180deg, rgba(3,17,31,${overlayOpacity * 0.45}) 0%, rgba(3,17,31,${overlayOpacity}) 100%)`,
        }}
      />

      {/* Conteúdo */}
      <div className="container-msm relative z-10 py-10 md:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="max-w-[600px] space-y-5 lg:col-span-7">
          <h1 className="font-serif text-[2.15rem] leading-[1.07] sm:text-[2.6rem] lg:text-[3.35rem] font-semibold text-balance [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">
            {renderRich(title)}
          </h1>
          <p className="max-w-[480px] text-base leading-relaxed text-white/85 text-pretty md:text-lg">
            {renderRich(subtitle)}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={primary.href} className="btn-primary group">
              {primary.label}
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
            <Link
              href={secondary.href}
              className="inline-flex items-center rounded-btn border border-white/40 px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:border-gold hover:text-gold"
            >
              {secondary.label}
            </Link>
          </div>
        </div>

        {/* Carrossel de 3 slides (despacho #4) — a tese fica fixa à esquerda;
            aqui giram as portas de entrada (solução / cascata / NI). */}
        <div className="relative mt-2 lg:col-span-5 lg:mt-0">
          {/* Glow ambiente (3c) — luz de palco difusa atrás do card: cyan
              quente + navy frio, bem espalhados, dão profundidade ao escuro. */}
          <div
            aria-hidden="true"
            className="absolute -inset-x-16 -inset-y-12 -z-10 bg-[radial-gradient(60%_55%_at_60%_42%,rgba(0,140,200,0.34)_0%,rgba(0,140,200,0.12)_38%,transparent_72%)] blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -inset-x-10 -inset-y-8 -z-10 bg-[radial-gradient(50%_50%_at_38%_70%,rgba(0,65,110,0.5)_0%,transparent_70%)] blur-2xl"
          />
          <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[540px]">
            <HeroSolutionsCarousel />
          </div>
        </div>
        </div>
      </div>

      {/* Play / pausa — só quando há vídeo real */}
      {videoUrl && (
        <button
          type="button"
          aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
          onClick={toggleVideo}
          className="absolute bottom-10 right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-deep_navy/40 text-white backdrop-blur-sm transition-all duration-200 ease-premium hover:border-gold md:right-10 md:h-14 md:w-14"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" strokeWidth={1.5} />
          ) : (
            <Play className="ml-0.5 h-5 w-5 fill-current" strokeWidth={1.5} />
          )}
        </button>
      )}
    </section>
  );
}
