'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import { ErrorScreen, BrokenGearIllustration } from '@/components/layout/ErrorScreen';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <ErrorScreen
      code="500"
      eyebrow="Erro inesperado"
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
