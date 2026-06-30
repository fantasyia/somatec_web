'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { SortableAdminList } from '@/components/admin/SortableAdminList';
import { StatusBadge } from '@/components/admin/StatusBadge';

type FooterColumn = { id: string; title: string };
type FooterLink = {
  id: string;
  label: string;
  href: string;
  column_id: string;
  display_order: number;
  active: boolean;
};

export function FooterLinksListClient({
  columns,
  links,
}: {
  columns: FooterColumn[];
  links: FooterLink[];
}) {
  // Agrupa por column_id
  const grouped = links.reduce<Record<string, FooterLink[]>>((acc, link) => {
    (acc[link.column_id] ??= []).push(link);
    return acc;
  }, {});

  const columnIds = Object.keys(grouped);

  if (columnIds.length === 0) {
    return <p className="text-sm text-[rgb(var(--text-muted))]/60 py-8 text-center">Nenhum link cadastrado.</p>;
  }

  return (
    <div className="space-y-8">
      {columnIds.map((columnId) => {
        const colTitle = columns.find((c) => c.id === columnId)?.title ?? columnId.slice(0, 8);
        return (
          <div key={columnId}>
            <h3 className="text-[11px] uppercase tracking-widest font-semibold text-[rgb(var(--text-muted))]/80 mb-3">
              Coluna: <span className="text-gold">{colTitle}</span>
            </h3>
            <SortableAdminList
              initial={grouped[columnId]!}
              table="footer_links"
              empty="Sem links nesta coluna."
              renderItem={(item) => (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[rgb(var(--text))]/90">{item.label}</p>
                    <p className="text-[11px] font-mono text-[rgb(var(--text-muted))]/80 truncate">{item.href}</p>
                  </div>
                  <StatusBadge status={item.active} />
                  <Link
                    href={`/admin/footer/link/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                  >
                    <Pencil className="h-3 w-3" strokeWidth={2} /> Editar
                  </Link>
                </>
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
