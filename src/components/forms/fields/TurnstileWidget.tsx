'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [scriptLoaded, setScriptLoaded] = useState(false);

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

  useEffect(() => {
    if (scriptLoaded) render();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, render]);

  if (!siteKey) {
    // Dev sem configurar: não renderiza nada e onToken nunca é chamado
    // O servidor aceita ausência de token em dev (verifyTurnstile pula).
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} />
    </>
  );
}
