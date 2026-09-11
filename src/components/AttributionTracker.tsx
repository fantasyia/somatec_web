'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAttribution } from '@/lib/attribution';
import { marcarTrafegoInterno } from '@/lib/analytics/trafego-interno';

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
    // Mesma carona: entrada por link interno com `utm_source=teste_leo` não
    // re-executa o snippet do `<head>`, e sem isto a marcação só valeria no
    // load completo.
    marcarTrafegoInterno();
  }, [pathname]);
  return null;
}
