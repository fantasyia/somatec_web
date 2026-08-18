'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, GaugeCircle, Calculator, type LucideIcon } from 'lucide-react';

// =============================================================================
// Barra sticky de conversão — aparece após ~60% de scroll da página.
// Dispensável; a dispensa vale pela sessão (sessionStorage). Não aparece em
// /contato, /ferramentas/* (já são páginas de conversão) nem no admin.
//
// 🔒 A OFERTA MUDA POR PÚBLICO. No industrial é o diagnóstico gratuito
// ("medição na sua planta"). Nas LPs NI isso é linguagem de fábrica na cara de
// dono de casa e de padaria — lá a barra chama a calculadora da própria página
// (#calculadora), nunca /contato: a trilha NI é compra direta, sem vendedor.
// =============================================================================

const HIDDEN_PREFIXES = ['/contato', '/ferramentas', '/admin', '/login'];

type Oferta = {
  Icon: LucideIcon;
  destaque: string;
  complemento: string;
  cta: string;
  href: string;
  fecharLabel: string;
};

const OFERTA_INDUSTRIAL: Oferta = {
  Icon: GaugeCircle,
  destaque: 'Diagnóstico gratuito da sua rede',
  complemento: 'medição na sua planta, sem custo e sem compromisso.',
  cta: 'Solicitar',
  href: '/contato',
  fecharLabel: 'Fechar barra de diagnóstico',
};

/** Copy aprovada pelo Léo (despacho 2026-08-18). */
const OFERTA_NI: Record<string, Oferta> = {
  '/protecao-residencial': {
    Icon: Calculator,
    destaque: 'Monte a proteção da sua casa em 2 minutos',
    complemento: 'sem vendedor.',
    cta: 'Calcular agora',
    href: '#calculadora',
    fecharLabel: 'Fechar barra da calculadora',
  },
  '/protecao-comercial': {
    Icon: Calculator,
    destaque: 'Monte a proteção do seu negócio em 2 minutos',
    complemento: 'sem vendedor.',
    cta: 'Calcular agora',
    href: '#calculadora',
    fecharLabel: 'Fechar barra da calculadora',
  },
};

export function StickyCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Dispensa persistida na sessão: checada aqui (não no corpo do efeito)
      // pra não fazer setState síncrono no mount (react-hooks/set-state-in-effect).
      if (sessionStorage.getItem('stc-sticky-cta-dismissed') === '1') return;
      const doc = document.documentElement;
      const progress = doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight);
      setVisible(progress > 0.6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (dismissed || !pathname || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const oferta = OFERTA_NI[pathname] ?? OFERTA_INDUSTRIAL;
  const { Icon } = oferta;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-premium ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="border-t border-white/10 bg-deep_navy/95 texture-dark text-white shadow-premium-dark backdrop-blur-md">
        <div className="container-msm flex items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Icon className="hidden h-6 w-6 shrink-0 text-cyan sm:block" strokeWidth={1.75} aria-hidden="true" />
            <p className="truncate text-sm">
              <span className="font-sans font-semibold">{oferta.destaque}</span>
              <span className="hidden text-white/70 md:inline"> — {oferta.complemento}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={oferta.href} className="btn-primary !px-4 !py-2 text-sm">
              {oferta.cta}
            </Link>
            <button
              type="button"
              aria-label={oferta.fecharLabel}
              onClick={() => {
                sessionStorage.setItem('stc-sticky-cta-dismissed', '1');
                setDismissed(true);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
