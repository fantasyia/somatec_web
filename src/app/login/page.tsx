import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Área do Representante',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const externalUrl = process.env.NEXT_PUBLIC_REPRESENTATIVE_APP_URL;

  if (externalUrl) {
    redirect(externalUrl);
  }

  // Fallback quando a URL externa ainda não foi configurada
  return (
    <section className="container-msm py-32 md:py-40">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <span className="placeholder-tag">Portal externo</span>
        <h1 className="font-serif text-h2-d md:text-h1-d font-semibold text-balance">
          Área do Representante
        </h1>
        <p className="text-[rgb(var(--text-muted))] leading-relaxed text-pretty">
          O portal de representantes da Somatec Blocking será disponibilizado em breve
          em um aplicativo dedicado. Em caso de dúvidas, fale com o comercial.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/contato" className="btn-primary">
            Fale com o comercial
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-soft transition-colors"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Voltar para a home
          </Link>
        </div>
      </div>
    </section>
  );
}
