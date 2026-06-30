'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';

export type FormStatusKind = 'idle' | 'submitting' | 'success' | 'error';

type Props = {
  status: FormStatusKind;
  message?: string | null;
};

export function FormStatus({ status, message }: Props) {
  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 p-4 rounded-card border border-gold/40 bg-gold/5"
      >
        <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
        <p className="text-sm text-[rgb(var(--text))]">
          {message ?? 'Mensagem enviada com sucesso. Nossa equipe entrará em contato pelo WhatsApp.'}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex items-start gap-3 p-4 rounded-card border border-red-500/40 bg-red-500/5"
      >
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
        <p className="text-sm text-[rgb(var(--text))]">
          {message ?? 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.'}
        </p>
      </div>
    );
  }

  return null;
}
