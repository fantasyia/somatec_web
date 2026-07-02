import type { Metadata } from 'next';
import Link from 'next/link';
import { RedefinirSenhaForm } from './RedefinirSenhaForm';

export const metadata: Metadata = {
  title: 'Redefinir senha — Admin Somatec',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="font-serif text-2xl font-semibold text-[rgb(var(--text))] tracking-wide">Somatec</span>
          <p className="mt-1 text-xs font-sans uppercase tracking-[0.12em] text-gold">
            Painel Administrativo
          </p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 backdrop-blur-sm p-8 shadow-2xl">
          <h1 className="font-sans text-lg font-semibold text-[rgb(var(--text))] mb-1">
            Criar nova senha
          </h1>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-6">
            Defina a nova senha pra sua conta. Mínimo 8 caracteres com pelo menos 1 número.
          </p>

          <RedefinirSenhaForm />

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
