'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'A senha precisa ter no mínimo 8 caracteres.';
  if (!/\d/.test(pwd)) return 'A senha precisa conter pelo menos 1 número.';
  return null;
}

export function RedefinirSenhaForm() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Quando o user chega pelo link do email, o Supabase JS auto-detecta o
  // access_token no URL hash e cria a sessão. Esperamos isso acontecer
  // antes de habilitar o form.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setReady(true);
      } else {
        setSessionError(
          'Link inválido ou expirado. Solicite um novo link na página "Esqueci minha senha".',
        );
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const pwd = (fd.get('password') as string | null) ?? '';
    const confirm = (fd.get('confirm') as string | null) ?? '';

    const validationError = validatePassword(pwd);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    if (pwd !== confirm) {
      setError('As senhas não conferem.');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: pwd });
      if (updateError) {
        setError(updateError.message || 'Falha ao atualizar a senha.');
        setLoading(false);
        return;
      }
      // Sucesso — redireciona pro dashboard
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar a senha.');
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-6 text-[rgb(var(--text-muted))]">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
        {sessionError}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-sans font-medium text-[rgb(var(--text-muted))] mb-1.5 uppercase tracking-[0.08em]">
          Nova senha
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-3.5 py-2.5 pr-10 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]/80 hover:text-[rgb(var(--text))] transition-colors"
            tabIndex={-1}
            aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPwd ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-sans font-medium text-[rgb(var(--text-muted))] mb-1.5 uppercase tracking-[0.08em]">
          Confirmar nova senha
        </label>
        <input
          name="confirm"
          type={showPwd ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-3.5 py-2.5 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/40 border border-red-700/40 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            Salvando…
          </>
        ) : (
          'Definir nova senha'
        )}
      </button>
    </form>
  );
}
