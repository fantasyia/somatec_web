import type { Metadata } from 'next';
import { AdminLoginForm } from './AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin — MSM',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-10 text-center">
          <span className="font-serif text-2xl font-semibold text-[rgb(var(--text))] tracking-wide">
            MSM
          </span>
          <p className="mt-1 text-xs font-sans uppercase tracking-[0.12em] text-gold">
            Painel Administrativo
          </p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 backdrop-blur-sm p-8 shadow-2xl">
          <h1 className="font-sans text-lg font-semibold text-[rgb(var(--text))] mb-6">
            Entrar
          </h1>

          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
