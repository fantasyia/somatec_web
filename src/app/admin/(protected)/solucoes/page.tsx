import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata: Metadata = { title: 'Soluções — Admin MSM' };

export default async function SolucoesPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const { data: items } = await db
    .from('solutions')
    .select('id, title, slug, status, display_order, updated_at')
    .order('display_order');

  return (
    <div>
      <PageHeader
        title="Soluções"
        description="Soluções e serviços exibidos na home e nas páginas de solução"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Soluções' }]}
        action={
          <Link href="/admin/solucoes/new" className="admin-btn-primary">
            + Nova solução
          </Link>
        }
      />
      <AdminTable
        rows={items ?? []}
        keyField="id"
        columns={[
          { key: 'title', header: 'Título', render: (r) => <span className="text-white/90">{r.title}</span> },
          { key: 'slug', header: 'Slug', render: (r) => <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]/80">{r.slug}</span> },
          { key: 'order', header: 'Ordem', className: 'w-20', render: (r) => <span className="text-[rgb(var(--text-muted))]/80">{r.display_order}</span> },
          { key: 'status', header: 'Status', className: 'w-28', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'actions', header: '', className: 'w-16', render: (r) => (
            <Link href={`/admin/solucoes/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
              <Pencil className="h-3 w-3" strokeWidth={2} /> Editar
            </Link>
          )},
        ]}
        empty="Nenhuma solução cadastrada."
      />
    </div>
  );
}
