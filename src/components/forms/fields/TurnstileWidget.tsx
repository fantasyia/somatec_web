'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

// Cloudflare Turnstile widget — modo invisível (size: 'invisible').
// Renderiza apenas se NEXT_PUBLIC_TURNSTILE_SITE_KEY estiver definida.
// Em dev sem chave, exporta um <span/> e o token fica vazio (o servidor tolera com warning).

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        opts: {
          sitekey: string;
          size?: 'normal' | 'compact' | 'invisible';
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          appearance?: 'always' | 'execute' | 'interaction-only';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      execute: (widgetId?: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string) => void;
  theme?: 'light' | 'dark' | 'auto';
};

export function TurnstileWidget({ onToken, theme = 'auto' }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const render = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !siteKey) return;
    if (widgetIdRef.current) return; // já renderizado
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      size: 'invisible',
      theme,
      appearance: 'interaction-only',
      callback: (token) => onToken(token),
      'error-callback': () => onToken(''),
      'expired-callback': () => onToken(''),
    });
  }, [siteKey, onToken, theme]);

  // Espera o script ficar disponível e renderiza — SEM estado no meio.
  //
  // Antes isto dependia do `onLoad` do <Script>, que só dispara pra QUEM
  // carrega o script. Quando uma segunda instância montava depois (o checkout
  // tem uma no passo de contato e outra no de pagamento), o script já estava na
  // página, o `onLoad` não vinha, e o widget nunca renderizava — o envio saía
  // com `captcha_token` vazio e o servidor devolvia 400.
  //
  // Era bug latente: antes só um widget montava por sessão. Passou a doer
  // quando o segundo apareceu.
  //
  // Sem `scriptLoaded`: guardar "o script chegou" em estado obrigava a chamar
  // setState dentro do efeito, o que dispara render em cascata. O que importa
  // não é o estado — é ter renderizado o widget, e disso o `widgetIdRef` já dá
  // conta.
  useEffect(() => {
    if (!siteKey) return;
    let parado = false;

    const tentar = () => {
      if (parado) return true;
      if (!window.turnstile || !containerRef.current) return false;
      render();
      return true;
    };

    if (tentar()) return;

    const t = setInterval(() => {
      if (tentar()) clearInterval(t);
    }, 100);
    // Desiste depois de 15s: numa página onde o script foi bloqueado (adblock,
    // rede corporativa) o intervalo rodaria pra sempre.
    const limite = setTimeout(() => clearInterval(t), 15_000);

    return () => {
      parado = true;
      clearInterval(t);
      clearTimeout(limite);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, render]);

  if (!siteKey) {
    // Dev sem configurar: não renderiza nada e onToken nunca é chamado
    // O servidor aceita ausência de token em dev (verifyTurnstile pula).
    return null;
  }

  return (
    <>
      {/* Sem `onLoad`: quem espera o script é o efeito acima, que funciona
          tanto pra primeira instância quanto pras seguintes. */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div ref={containerRef} />
    </>
  );
}
