'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import { ErrorScreen, BrokenGearIllustration } from '@/components/layout/ErrorScreen';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 🔴 Sem isto o erro morre no console do cliente. Error boundary do App
    // Router não dispara window.onerror nem unhandledrejection, então o SDK do
    // Sentry só enxerga o erro se captarmos aqui (recomendação oficial do
    // @sentry/nextjs pra error.tsx). Até 13/09 só havia console.error: um erro
    // de render em produção (ex.: sessionStorage bloqueado numa LP) mostrava a
    // tela 500 pro visitante e não chegava a ninguém.
    Sentry.captureException(error);
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <ErrorScreen
      code="500"
      title="Algo deu errado"
      description="Ocorreu um erro inesperado de nossa parte. Tente recarregar a página ou siga por um dos caminhos abaixo."
      illustration={<BrokenGearIllustration />}
      actions={
        <>
          <button onClick={() => reset()} className="btn-primary">
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Tentar novamente
          </button>
          <Link href="/" className="btn-outline-light">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Voltar à home
          </Link>
          <Link
            href="/contato"
            className="text-sm font-sans font-semibold text-white/60 hover:text-gold transition-colors underline underline-offset-4 inline-flex items-center gap-1.5"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            Falar com o comercial
          </Link>
        </>
      }
    />
  );
}
