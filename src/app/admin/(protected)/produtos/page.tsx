import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata: Metadata = { title: 'Produtos — Admin MSM' };

export default async function ProdutosPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const [{ data }, { data: brands }, { data: categories }] = await Promise.all([
    db.from('products').select('id, name, slug, status, featured, display_order, brand_id, category_id').order('display_order'),
    db.from('brands').select('id, name'),
    db.from('product_categories').select('id, name'),
  ]);

  const brandMap = Object.fromEntries((brands ?? []).map((b) => [b.id, b.name]));
  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));

  type Row = { id: string; name: string; slug: string; status: string; featured: boolean; display_order: number; brand_id: string | null; category_id: string | null };

  return (
    <div>
      <PageHeader title="Produtos" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Produtos' }]}
        action={<Link href="/admin/produtos/new" className="admin-btn-primary">+ Novo produto</Link>} />
      <AdminTable
        rows={(data ?? []) as Row[]}
        keyField="id"
        columns={[
          { key: 'name', header: 'Nome', render: (r) => <span className="text-white/90">{r.name}</span> },
          { key: 'brand', header: 'Marca', render: (r) => <span className="text-[12px] text-[rgb(var(--text-muted))]">{r.brand_id ? (brandMap[r.brand_id] ?? '—') : '—'}</span> },
          { key: 'category', header: 'Categoria', render: (r) => <span className="text-[12px] text-[rgb(var(--text-muted))]">{r.category_id ? (catMap[r.category_id] ?? '—') : '—'}</span> },
          { key: 'featured', header: 'Destaque', className: 'w-24', render: (r) => <StatusBadge status={r.featured} trueLabel="Destaque" falseLabel="Normal" /> },
          { key: 'status', header: 'Status', className: 'w-28', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'actions', header: '', className: 'w-16', render: (r) => <Link href={`/admin/produtos/${r.id}`} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Pencil className="h-3 w-3" strokeWidth={2} /> Editar</Link> },
        ]}
        empty="Nenhum produto cadastrado."
      />
    </div>
  );
}
