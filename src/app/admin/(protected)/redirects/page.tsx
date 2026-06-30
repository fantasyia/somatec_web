import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata: Metadata = { title: 'Redirects — Admin MSM' };

export default async function RedirectsPage() {
  await requireAdmin();
  const { data } = await getSupabaseAdminClient()
    .from('redirects')
    .select('id, from_path, to_path, status_code, active, notes, updated_at')
    .order('from_path');

  return (
    <div>
      <PageHeader title="Redirects" description="Regras de redirecionamento de URL"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Redirects' }]}
        action={<Link href="/admin/redirects/new" className="admin-btn-primary">+ Novo redirect</Link>} />
      <AdminTable rows={data ?? []} keyField="id" columns={[
        { key: 'from', header: 'De', render: (r) => <span className="font-mono text-sm text-white/80">{r.from_path}</span> },
        { key: 'to', header: 'Para', render: (r) => <span className="font-mono text-sm text-[rgb(var(--text-muted))]">{r.to_path}</span> },
        { key: 'code', header: 'Código', className: 'w-20', render: (r) => <span className="font-mono text-[12px] text-gold">{r.status_code}</span> },
        { key: 'notes', header: 'Notas', render: (r) => <span className="text-[11px] text-[rgb(var(--text-muted))]/70">{r.notes ?? '—'}</span> },
        { key: 'status', header: 'Status', className: 'w-24', render: (r) => <StatusBadge status={r.active} /> },
        { key: 'actions', header: '', className: 'w-16', render: (r) => <Link href={`/admin/redirects/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Pencil className="h-3 w-3" strokeWidth={2} /> Editar</Link> },
      ]} empty="Nenhum redirect cadastrado." />
    </div>
  );
}
