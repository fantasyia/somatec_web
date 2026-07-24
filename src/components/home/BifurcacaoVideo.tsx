'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * Mídia do painel INDUSTRIAL da bifurcação (despacho vídeo night→day):
 * timelapse noite→dia curto SÓ no desktop (mobile fica no poster, pra não
 * pesar) e SÓ sem prefers-reduced-motion (reduced = poster de dia).
 *
 * PLAY-ONCE parando no frame de dia (não loop): o corte dia↔noite de um loop
 * seria brusco — o despacho já previu cair pra play-once. O poster (dia) é o
 * mesmo frame em que o vídeo congela, então não há salto no fim. H.264
 * comprimido (~1,3 MB). SSR renderiza o poster (LCP/fallback); o vídeo entra
 * no mount se couber.
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
        src="/home/industria-24h.mp4"
        poster="/home/industria-24h-poster.webp"
        autoPlay
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
    );
  }

  // Desktop reduced-motion / mobile: poster estático de DIA.
  return (
    <Image
      src="/home/industria-24h-poster.webp"
      alt="Planta industrial ao amanhecer"
      fill
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 33vw"
      className="absolute inset-0 object-cover"
    />
  );
}
