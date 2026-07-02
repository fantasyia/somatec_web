import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata: Metadata = { title: 'Páginas — Admin Somatec' };

export default async function PaginasPage() {
  await requireAdmin();
  const { data } = await getSupabaseAdminClient()
    .from('pages')
    .select('id, title, slug, route_path, page_type, status, updated_at')
    .order('title');

  return (
    <div>
      <PageHeader title="Páginas" description="Páginas institucionais com seções de conteúdo"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Páginas' }]}
        action={<Link href="/admin/paginas/new" className="admin-btn-primary">+ Nova página</Link>} />
      <AdminTable rows={data ?? []} keyField="id" columns={[
        { key: 'title', header: 'Título', render: (r) => <span className="text-white/90">{r.title}</span> },
        { key: 'route', header: 'Rota', render: (r) => <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]">{r.route_path}</span> },
        { key: 'type', header: 'Tipo', render: (r) => <span className="text-[11px] text-[rgb(var(--text-muted))]/80">{r.page_type}</span> },
        { key: 'updated', header: 'Atualizado', className: 'w-32', render: (r) => <span className="text-[11px] text-[rgb(var(--text-muted))]/70">{new Date(r.updated_at).toLocaleDateString('pt-BR')}</span> },
        { key: 'status', header: 'Status', className: 'w-28', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'actions', header: '', className: 'w-16', render: (r) => <Link href={`/admin/paginas/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Pencil className="h-3 w-3" strokeWidth={2} /> Editar</Link> },
      ]} empty="Nenhuma página cadastrada." />
    </div>
  );
}
