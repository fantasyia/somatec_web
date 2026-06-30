'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function EsqueciSenhaForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = (fd.get('email') as string | null)?.trim().toLowerCase() ?? '';

    if (email) {
      try {
        const supabase = getSupabaseBrowserClient();
        const redirectTo = `${window.location.origin}/admin/redefinir-senha`;
        // Resposta deliberadamente ignorada: nunca distinguimos "e-mail existe"
        // vs "não existe" pra evitar enumeração de contas.
        await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      } catch {
        // Mesmo se falhar, mostramos sucesso (anti-enumeração).
      }
    }

    // Pequeno delay artificial pra disfarçar timing (anti-enumeração).
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 600);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-4 text-sm text-emerald-300">
        <p className="font-medium mb-1">Tudo certo.</p>
        <p className="text-xs text-emerald-300/90">
          Se houver uma conta admin com esse e-mail, você receberá em instantes um link pra criar uma nova senha. Verifique também a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-sans font-medium text-[rgb(var(--text-muted))] mb-1.5 uppercase tracking-[0.08em]">
          E-mail
        </label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-3.5 py-2.5 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
          placeholder="admin@msm.com.br"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            Enviando…
          </>
        ) : (
          'Enviar link de redefinição'
        )}
      </button>
    </form>
  );
}
