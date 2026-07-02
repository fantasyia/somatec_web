import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { FooterLinksListClient } from './FooterLinksListClient';

export const metadata: Metadata = { title: 'Footer — Admin Somatec' };

type FooterColumn = { id: string; title: string; display_order: number; active: boolean };
type FooterLink = { id: string; label: string; href: string; column_id: string; display_order: number; active: boolean };

export default async function FooterPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const [{ data: colsRaw }, { data: linksRaw }] = await Promise.all([
    db.from('footer_columns').select('id, title, display_order, active').order('display_order'),
    db.from('footer_links').select('id, label, href, column_id, display_order, active').order('display_order'),
  ]);
  const columns = (colsRaw as unknown as FooterColumn[] | null) ?? [];
  const links = (linksRaw as unknown as FooterLink[] | null) ?? [];

  return (
    <div>
      <PageHeader title="Footer" description="Colunas e links do rodapé" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Footer' }]} />
      <div className="p-6 lg:p-8 space-y-8">
        {/* Columns — usa AdminTable (sem DnD por enquanto; só links têm DnD per spec C) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-muted))] uppercase tracking-[0.08em]">Colunas</h2>
            <Link href="/admin/footer/nova-coluna" className="admin-btn-primary text-xs py-1.5 px-3">+ Nova coluna</Link>
          </div>
          <AdminTable rows={columns} keyField="id" columns={[
            { key: 'title', header: 'Título', render: (r) => <span className="text-[rgb(var(--text))]/90">{r.title}</span> },
            { key: 'order', header: 'Ordem', className: 'w-20', render: (r) => <span className="text-[rgb(var(--text-muted))]/80">{r.display_order}</span> },
            { key: 'status', header: 'Status', className: 'w-24', render: (r) => <StatusBadge status={r.active} /> },
            { key: 'actions', header: '', className: 'w-16', render: (r) => <Link href={`/admin/footer/coluna/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Pencil className="h-3 w-3" strokeWidth={2} /> Editar</Link> },
          ]} empty="Nenhuma coluna cadastrada." />
        </div>

        {/* Links — agrupados por coluna, com DnD pra reordenar dentro de cada coluna */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-muted))] uppercase tracking-[0.08em]">Links</h2>
            <Link href="/admin/footer/novo-link" className="admin-btn-primary text-xs py-1.5 px-3">+ Novo link</Link>
          </div>
          <FooterLinksListClient columns={columns} links={links} />
        </div>
      </div>
    </div>
  );
}
