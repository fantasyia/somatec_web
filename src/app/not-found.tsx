import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { ErrorScreen, CompassIllustration } from '@/components/layout/ErrorScreen';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      eyebrow="Erro 404"
      title="Página não encontrada"
      description="A página que você procura pode ter sido movida, removida ou nunca existiu. Verifique o endereço ou siga por um dos caminhos abaixo."
      illustration={<CompassIllustration />}
      actions={
        <>
          <Link href="/" className="btn-primary">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Voltar à home
          </Link>
          <Link href="/contato" className="btn-outline-light">
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
            Falar com o comercial
          </Link>
          <Link
            href="/produtos"
            className="text-sm font-sans font-semibold text-white/60 hover:text-gold transition-colors underline underline-offset-4"
          >
            Explorar produtos
          </Link>
        </>
      }
    />
  );
}
