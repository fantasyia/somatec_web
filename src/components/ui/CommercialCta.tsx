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
  /** A FRASE INTEIRA que o cliente envia, em primeira pessoa, dizendo o que
   *  ele quer. Sem ela, cai na mensagem genérica do admin.
   *
   *  ⛔ Vai na BOCA do cliente: nada de nome interno de página nem de URL. */
  mensagem?: string;
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
 * CTA comercial server-side: vai pro WhatsApp com a frase de `mensagem`
 * quando o botão está habilitado, senão cai no formulário em `/contato`.
 *
 * Para CTAs formais (representante, trabalhe conosco), prefira `<Link>` direto.
 */
export async function CommercialCta({
  label,
  mensagem,
  fallbackPath,
  variant = 'primary',
  withArrow = true,
  className,
}: Props) {
  const config = await getWhatsAppButtonConfig();
  const href = buildCommercialCtaHref(config, { mensagem, fallbackPath });
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
