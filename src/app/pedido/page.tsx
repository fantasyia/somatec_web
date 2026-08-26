import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, PackageSearch, MessageCircle } from 'lucide-react';
import { AcompanharPedido } from '@/components/pedidos/AcompanharPedido';
import { DEFAULT_OG_IMAGES, whatsappHref } from '@/lib/constants/site';

export const metadata: Metadata = {
  title: 'Acompanhar pedido | Somatec Blocking',
  description:
    'Consulte o andamento do seu pedido do Master Block pelo número que você recebeu por e-mail.',
  alternates: { canonical: '/pedido' },
  // Página de serviço, não de conteúdo: não tem por que disputar busca.
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Acompanhar pedido',
    description: 'Consulte o andamento do seu pedido pelo número.',
    url: '/pedido',
    type: 'website',
    images: [...DEFAULT_OG_IMAGES],
  },
};

export const revalidate = 3600;

export default function PedidoPage() {
  return (
    <>
      <section className="container-msm pt-28 pb-10 md:pt-32">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
            <li>
              <Link href="/" className="transition-colors hover:text-cyan">
                Início
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              <span className="text-[rgb(var(--text))]">Acompanhar pedido</span>
            </li>
          </ol>
        </nav>

        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 font-sans text-xs font-semibold text-cyan">
            <PackageSearch className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Pedidos
          </span>
          <h1 className="mt-4 font-serif text-h2-m md:text-h1-d font-semibold leading-tight text-balance">
            Acompanhe seu pedido
          </h1>
          <p className="mt-4 text-[17px] leading-[1.8] text-[rgb(var(--text-muted))]">
            Digite o número que você recebeu por e-mail e veja em que etapa está a sua entrega,
            com o código de rastreio quando o pedido já tiver saído.
          </p>
        </div>
      </section>

      <div className="tone-surface">
        <section className="container-msm section-y">
          <AcompanharPedido />

          <div className="mt-10 max-w-xl rounded-card-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 md:p-6">
            <h2 className="font-serif text-lg font-semibold text-[rgb(var(--text))]">
              Não encontra o número?
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
              Ele foi enviado no e-mail de confirmação, logo depois que você fechou o pedido.
              Procure por &ldquo;Somatec&rdquo; na sua caixa de entrada — e no spam. Se mesmo assim
              não achar, chame a gente no WhatsApp que a gente localiza pelo seu nome.
            </p>
            <a
              href={whatsappHref('Olá! Fiz um pedido no site e não estou achando o número para acompanhar.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-semibold text-cyan transition-opacity hover:opacity-80"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Falar no WhatsApp
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
