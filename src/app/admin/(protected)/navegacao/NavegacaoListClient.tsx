'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { SortableAdminList } from '@/components/admin/SortableAdminList';
import { StatusBadge } from '@/components/admin/StatusBadge';

type NavRow = {
  id: string;
  label: string;
  href: string;
  location: string;
  display_order: number;
  active: boolean;
};

export function NavegacaoListClient({ items }: { items: NavRow[] }) {
  // Agrupa por location pra que reordenação faça sentido (header não compete com footer)
  const grouped = items.reduce<Record<string, NavRow[]>>((acc, item) => {
    (acc[item.location] ??= []).push(item);
    return acc;
  }, {});

  const locations = Object.keys(grouped).sort();

  if (locations.length === 0) {
    return <p className="text-sm text-[rgb(var(--text-muted))]/60 py-8 text-center">Nenhum item de navegação cadastrado.</p>;
  }

  return (
    <div className="space-y-8">
      {locations.map((location) => (
        <div key={location}>
          <h2 className="text-[11px] uppercase tracking-widest font-semibold text-[rgb(var(--text-muted))]/80 mb-3">
            Local: <span className="text-gold">{location}</span>
          </h2>
          <SortableAdminList
            initial={grouped[location]!}
            table="navigation_items"
            empty="Sem itens neste local."
            renderItem={(item) => (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[rgb(var(--text))]/90">{item.label}</p>
                  <p className="text-[11px] font-mono text-[rgb(var(--text-muted))]/80 truncate">{item.href}</p>
                </div>
                <StatusBadge status={item.active} />
                <Link
                  href={`/admin/navegacao/${item.id}`}
                  className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                >
                  <Pencil className="h-3 w-3" strokeWidth={2} /> Editar
                </Link>
              </>
            )}
          />
        </div>
      ))}
    </div>
  );
}
