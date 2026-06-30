import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  buildCommercialCtaHref,
  getWhatsAppButtonConfig,
  isExternalCtaHref,
} from '@/lib/whatsapp-button';

type Variant = 'primary' | 'secondary';

type Props = {
  /** Texto do botão. Ex: "Solicitar proposta", "Falar com a equipe". */
  label: string;
  /** Contexto enriquecedor da mensagem (nome do produto, marca, etc). */
  context?: string;
  /** Path interno usado quando WhatsApp está desabilitado. Default: '/contato'. */
  fallbackPath?: string;
  /** Estilo visual. Default: 'primary'. */
  variant?: Variant;
  /** Mostrar chevron à direita. Default: true. */
  withArrow?: boolean;
  /** Classes extras. */
  className?: string;
};

/**
 * CTA comercial server-side: vai pro WhatsApp (com mensagem enriquecida por
 * `context`) quando o admin habilitou o botão, senão cai no formulário em
 * `/contato`. Usar em produtos, marcas, receitas, soluções, etc.
 *
 * Para CTAs formais (representante, trabalhe conosco), prefira `<Link>` direto.
 */
export async function CommercialCta({
  label,
  context,
  fallbackPath,
  variant = 'primary',
  withArrow = true,
  className,
}: Props) {
  const config = await getWhatsAppButtonConfig();
  const href = buildCommercialCtaHref(config, { context, fallbackPath });
  const external = isExternalCtaHref(href);

  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const composedClass = [baseClass, className].filter(Boolean).join(' ');

  const content = (
    <>
      {label}
      {withArrow && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={composedClass}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={composedClass}>
      {content}
    </Link>
  );
}
