'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// Boundary de ÚLTIMO recurso: erro no próprio RootLayout (ou em algo que ele
// renderiza antes do <body>) não é pego pelo error.tsx de segmento — o Next
// troca a árvore inteira por este arquivo, que precisa trazer seu próprio
// <html>/<body>. Até 13/09 ele não existia: erro no layout raiz caía na tela
// padrão do Next e não ia pro Sentry. Aqui é mínimo de propósito — se o layout
// quebrou, não dá pra confiar em estilo, fonte ou componente nenhum.
// =============================================================================

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#00416E',
          color: '#fff',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Algo deu errado</h1>
          <p style={{ opacity: 0.7, marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Ocorreu um erro inesperado de nossa parte. Tente recarregar a página.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#008CC8',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
