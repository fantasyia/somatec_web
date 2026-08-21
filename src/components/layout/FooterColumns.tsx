'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { semIndustriaisSeNi } from '@/lib/constants/rotas-ni';

// =============================================================================
// Colunas de links do rodapé — a única parte dele que precisa saber a rota.
//
// O rodapé é server component e aparece em TODA página, então "Diagnóstico de
// VTCD" (custo de parada) e "Orçamento industrial (locação)" chegavam também
// em quem lê as LPs de casa e comércio. Nas rotas NI eles somem; o resto do
// rodapé segue renderizado no servidor.
//
// Coluna que fica VAZIA depois do filtro não vira título órfão: some inteira.
// =============================================================================

type FooterLink = { label: string; href: string };
type FooterColumnData = { title: string; links: FooterLink[] };

export function FooterColumns({ columns }: { columns: FooterColumnData[] }) {
  const pathname = usePathname();

  const visiveis = columns
    .map((col) => ({ ...col, links: semIndustriaisSeNi(col.links, pathname) }))
    .filter((col) => col.links.length > 0);

  return (
    <>
      {visiveis.map((col) => (
        <div key={col.title}>
          {/* Marca: laranja é exclusivo de CTA/Master Block — cabeçalho de
              coluna usa branco. */}
          <h3 className="text-sm font-semibold text-white mb-4">{col.title}</h3>
          <ul className="space-y-2.5">
            {col.links.map((link) => (
              <li key={`${col.title}-${link.label}-${link.href}`}>
                <Link
                  href={link.href}
                  className="text-sm text-white/70 hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
