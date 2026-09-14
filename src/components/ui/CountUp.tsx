'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Anima um número de 0 até o valor quando entra na viewport (uma vez).
 * Recebe o texto completo ("92%", "100 kHz", "até 70%", "~R$1 mi") e anima só a
 * parte numérica, preservando prefixo ("até ", "~R$") e sufixo. Sem parte
 * numérica → renderiza como veio.
 * Respeita prefers-reduced-motion (mostra o valor final direto).
 */
export function CountUp({ value, durationMs = 1400 }: { value: string; durationMs?: number }) {
  const match = /^(\D*?)(\d+)(.*)$/.exec(value.trim());
  const prefix = match ? match[1] : '';
  const target = match ? parseInt(match[2], 10) : null;
  const suffix = match ? match[3] : '';

  const ref = useRef<HTMLSpanElement>(null);
  // 🔴 COMEÇA NO VALOR FINAL, não em zero (M21 da auditoria 13/09).
  //
  // Com `useState(0)` o HTML SERVIDO saía "0%" e "~R$0 mi": o número real
  // ficava só na cópia `aria-hidden` que existe pra reservar largura. Quem lê
  // a página sem executar JS — boa parte dos crawlers de IA — via zero nos
  // números-prova de `/resultados`, `/industrias/*` e da home. E leitor de
  // tela, que respeita `aria-hidden`, anunciava "0% de supressão".
  //
  // Agora o valor certo está no HTML desde o primeiro byte, e a animação vira
  // enfeite de quem tem JS: só acontece se o elemento estiver ABAIXO DA DOBRA
  // no mount, que é o caso em que ela faz sentido. Já visível na tela? Fica o
  // valor final, sem piscar de 92 pra 0 e voltar.
  const [display, setDisplay] = useState<number | null>(target);

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;
    // Já está na tela: nada a animar — o valor correto já está renderizado.
    if (el.getBoundingClientRect().top <= window.innerHeight) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Zerar aqui É deliberado, e é a única vez que isto roda: o elemento
    // está ABAIXO DA DOBRA (a checagem acima garante), ninguém está olhando,
    // e sem zerar não existe de onde contar. A regra protege de renders em
    // cascata; este é um render só, no mount, em elemento fora da tela.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ponto de partida da animação, fora da tela
    setDisplay(0);

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // (prefers-reduced-motion já foi verificado antes de zerar o valor.)
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          setDisplay(Math.round(eased * target));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  if (target === null) return <>{value}</>;

  return (
    // Cópia invisível do valor final reserva a largura — o texto centralizado
    // não "anda" enquanto o número sobe.
    <span ref={ref} className="relative inline-block tabular-nums">
      <span aria-hidden="true" className="invisible">
        {prefix}
        {target}
        {suffix}
      </span>
      <span className="absolute inset-0">
        {prefix}
        {display}
        {suffix}
      </span>
    </span>
  );
}
