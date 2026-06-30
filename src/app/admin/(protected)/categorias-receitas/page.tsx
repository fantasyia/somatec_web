import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata: Metadata = { title: 'Categorias de Receita — Admin MSM' };

export default async function CategoriasReceitasPage() {
  await requireAdmin();
  const { data } = await getSupabaseAdminClient().from('recipe_categories').select('id, name, slug, status, display_order').order('display_order');
  return (
    <div>
      <PageHeader title="Categorias de Receita" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Cat. Receitas' }]}
        action={<Link href="/admin/categorias-receitas/new" className="admin-btn-primary">+ Nova categoria</Link>} />
      <AdminTable rows={data ?? []} keyField="id" columns={[
        { key: 'name', header: 'Nome', render: (r) => <span className="text-white/90">{r.name}</span> },
        { key: 'slug', header: 'Slug', render: (r) => <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]/80">{r.slug}</span> },
        { key: 'order', header: 'Ordem', className: 'w-20', render: (r) => <span className="text-[rgb(var(--text-muted))]/80">{r.display_order}</span> },
        { key: 'status', header: 'Status', className: 'w-28', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'actions', header: '', className: 'w-16', render: (r) => <Link href={`/admin/categorias-receitas/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Pencil className="h-3 w-3" strokeWidth={2} /> Editar</Link> },
      ]} empty="Nenhuma categoria de receita cadastrada." />
    </div>
  );
}
