'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * Mídia do painel INDUSTRIAL da bifurcação (despacho vídeo-atmosfera):
 * vídeo curto em loop SÓ no desktop (mobile fica na still, pra não pesar) e
 * SÓ sem prefers-reduced-motion (reduced = still). Poster = frame limpo do
 * próprio vídeo (fallback se não carregar). A still do foundry
 * (bifurcacao-industrial) segue no repo como backup/mobile.
 * SSR renderiza a still (LCP/fallback); o vídeo entra no mount se couber.
 */
export function BifurcacaoVideo() {
  const [playVideo, setPlayVideo] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const desktop = window.matchMedia('(min-width: 768px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const decide = () => setPlayVideo(desktop.matches && !reduce.matches);
    decide();
    desktop.addEventListener('change', decide);
    reduce.addEventListener('change', decide);
    return () => {
      desktop.removeEventListener('change', decide);
      reduce.removeEventListener('change', decide);
    };
  }, []);

  if (playVideo) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/home/industrial-atmosfera-v2.mp4"
        poster="/home/industrial-atmosfera-poster.webp"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="absolute inset-0 animate-ken-burns motion-reduce:animate-none">
      <Image
        src="/home/bifurcacao-industrial.webp"
        alt="Planta industrial em operação"
        fill
        loading="lazy"
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}
