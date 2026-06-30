import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata: Metadata = { title: 'Marcas — Admin MSM' };

export default async function MarcasPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const { data } = await db.from('brands').select('id, name, slug, status, featured, display_order').order('display_order');

  return (
    <div>
      <PageHeader
        title="Marcas"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Marcas' }]}
        action={<Link href="/admin/marcas/new" className="admin-btn-primary">+ Nova marca</Link>}
      />
      <AdminTable
        rows={data ?? []}
        keyField="id"
        columns={[
          { key: 'name', header: 'Nome', render: (r) => <span className="text-white/90">{r.name}</span> },
          { key: 'slug', header: 'Slug', render: (r) => <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]/80">{r.slug}</span> },
          { key: 'featured', header: 'Destaque', className: 'w-24', render: (r) => <StatusBadge status={r.featured} trueLabel="Destaque" falseLabel="Normal" /> },
          { key: 'status', header: 'Status', className: 'w-28', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'actions', header: '', className: 'w-16', render: (r) => (
            <Link href={`/admin/marcas/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
              <Pencil className="h-3 w-3" strokeWidth={2} /> Editar
            </Link>
          )},
        ]}
        empty="Nenhuma marca cadastrada."
      />
    </div>
  );
}
