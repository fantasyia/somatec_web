'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, GaugeCircle } from 'lucide-react';

// =============================================================================
// Barra sticky de conversão — aparece após ~60% de scroll da página, oferece
// o diagnóstico gratuito (passo 1 do modelo sem risco). Dispensável; a
// dispensa vale pela sessão (sessionStorage). Não aparece em /contato,
// /ferramentas/* (já são páginas de conversão) nem no admin.
// =============================================================================

const HIDDEN_PREFIXES = ['/contato', '/ferramentas', '/admin', '/login'];

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

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-premium ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="border-t border-white/10 bg-deep_navy/95 texture-diagonal text-white shadow-premium-dark backdrop-blur-md">
        <div className="container-msm flex items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <GaugeCircle className="hidden h-6 w-6 shrink-0 text-cyan sm:block" strokeWidth={1.75} aria-hidden="true" />
            <p className="truncate text-sm">
              <span className="font-sans font-semibold">Diagnóstico gratuito da sua rede</span>
              <span className="hidden text-white/70 md:inline">
                {' '}
                — medição na sua planta, sem custo e sem compromisso.
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/contato" className="btn-primary !px-4 !py-2 text-sm">
              Solicitar
            </Link>
            <button
              type="button"
              aria-label="Fechar barra de diagnóstico"
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
