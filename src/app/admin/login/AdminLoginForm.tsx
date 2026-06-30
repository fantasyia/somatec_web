'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next');
  // Aceita apenas caminho interno relativo (evita open-redirect/phishing pós-login):
  // rejeita URLs absolutas (https://), protocol-relative (//) e o truque /\ .
  const next =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\')
      ? rawNext
      : undefined;
  const queryError = searchParams.get('error');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const raw = await res.text();
      let data: { ok: boolean; message?: string } | null = null;
      try { data = JSON.parse(raw) as { ok: boolean; message?: string }; } catch { /* not JSON */ }

      if (data?.ok) {
        router.push(next ?? '/admin');
        router.refresh();
        return;
      }
      if (data) {
        setError(data.message ?? `Erro ${res.status}`);
      } else {
        // Resposta não é JSON — tipicamente HTML de erro 500 do servidor.
        setError(`Erro ${res.status} no servidor. ${raw.slice(0, 140)}`);
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? `Falha de rede: ${err.message}` : 'Não foi possível conectar.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {queryError === 'unauthorized' && !error && (
        <div className="rounded-lg bg-red-900/40 border border-red-700/40 px-3.5 py-2.5 text-sm text-red-300">
          Sua conta não tem permissão de acesso ao painel.
        </div>
      )}
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

      <div>
        <label className="block text-xs font-sans font-medium text-[rgb(var(--text-muted))] mb-1.5 uppercase tracking-[0.08em]">
          Senha
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-3.5 py-2.5 pr-10 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]/80 hover:text-white/70 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
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
            Entrando…
          </>
        ) : (
          'Entrar'
        )}
      </button>

      <p className="text-center text-xs text-[rgb(var(--text-muted))] pt-1">
        <Link href="/admin/esqueci-senha" className="hover:text-gold transition-colors">
          Esqueceu sua senha?
        </Link>
      </p>
    </form>
  );
}
