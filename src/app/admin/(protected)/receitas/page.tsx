import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata: Metadata = { title: 'Receitas — Admin MSM' };

export default async function ReceitasPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const [{ data }, { data: categories }] = await Promise.all([
    db.from('recipes').select('id, title, slug, status, featured, display_order, category_id').order('display_order'),
    db.from('recipe_categories').select('id, name'),
  ]);

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));
  type Row = { id: string; title: string; slug: string; status: string; featured: boolean; display_order: number; category_id: string | null };

  return (
    <div>
      <PageHeader title="Receitas" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Receitas' }]}
        action={<Link href="/admin/receitas/new" className="admin-btn-primary">+ Nova receita</Link>} />
      <AdminTable
        rows={(data ?? []) as Row[]}
        keyField="id"
        columns={[
          { key: 'title', header: 'Título', render: (r) => <span className="text-white/90">{r.title}</span> },
          { key: 'category', header: 'Categoria', render: (r) => <span className="text-[12px] text-[rgb(var(--text-muted))]">{r.category_id ? (catMap[r.category_id] ?? '—') : '—'}</span> },
          { key: 'featured', header: 'Destaque', className: 'w-24', render: (r) => <StatusBadge status={r.featured} trueLabel="Destaque" falseLabel="Normal" /> },
          { key: 'status', header: 'Status', className: 'w-28', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'actions', header: '', className: 'w-16', render: (r) => <Link href={`/admin/receitas/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Pencil className="h-3 w-3" strokeWidth={2} /> Editar</Link> },
        ]}
        empty="Nenhuma receita cadastrada."
      />
    </div>
  );
}
