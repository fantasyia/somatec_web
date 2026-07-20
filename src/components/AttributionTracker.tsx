'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAttribution } from '@/lib/attribution';

/**
 * Dispara a captura de atribuição (UTM/gclid/fbclid) na chegada do visitante e
 * a cada troca de rota. Montado uma vez no layout — não renderiza nada.
 * O clique de campanha é sempre um load completo (link externo → landing), então
 * o mount já cobre o caso principal; o pathname cobre navegações client-side.
 */
export function AttributionTracker() {
  const pathname = usePathname();
  useEffect(() => {
    captureAttribution();
  }, [pathname]);
  return null;
}
