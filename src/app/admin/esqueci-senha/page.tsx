import type { Metadata } from 'next';
import Link from 'next/link';
import { EsqueciSenhaForm } from './EsqueciSenhaForm';

export const metadata: Metadata = {
  title: 'Esqueci minha senha — Admin Somatec',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function EsqueciSenhaPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-10 text-center">
          <span className="font-serif text-2xl font-semibold text-[rgb(var(--text))] tracking-wide">Somatec</span>
          <p className="mt-1 text-xs font-sans uppercase tracking-[0.12em] text-gold">
            Painel Administrativo
          </p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 backdrop-blur-sm p-8 shadow-2xl">
          <h1 className="font-sans text-lg font-semibold text-[rgb(var(--text))] mb-1">
            Redefinir senha
          </h1>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-6">
            Informe seu e-mail. Se houver uma conta admin associada, você receberá um link pra criar uma nova senha.
          </p>

          <EsqueciSenhaForm />

          <p className="mt-6 text-center text-xs text-[rgb(var(--text-muted))]">
            <Link href="/admin/login" className="text-gold hover:underline">
              ← Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
