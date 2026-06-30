'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { SortableAdminList } from '@/components/admin/SortableAdminList';
import { StatusBadge } from '@/components/admin/StatusBadge';

type BannerRow = {
  id: string;
  title: string;
  location: string;
  route_path: string | null;
  active: boolean;
  display_order: number;
};

export function BannersListClient({ items }: { items: BannerRow[] }) {
  return (
    <SortableAdminList
      initial={items}
      table="banners"
      empty="Nenhum banner cadastrado."
      renderItem={(item) => (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[rgb(var(--text))]/90 truncate">{item.title}</p>
            <p className="text-[11px] text-[rgb(var(--text-muted))]/80 font-mono">
              {item.location}
              {item.route_path ? ` · ${item.route_path}` : ''}
            </p>
          </div>
          <StatusBadge status={item.active} />
          <Link
            href={`/admin/banners/${item.id}`}
            className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
          >
            <Pencil className="h-3 w-3" strokeWidth={2} /> Editar
          </Link>
        </>
      )}
    />
  );
}
