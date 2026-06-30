import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProdutoForm } from '../ProdutoForm';

export default async function NewProdutoPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const [{ data: brands }, { data: categories }] = await Promise.all([
    db.from('brands').select('id, name').order('name'),
    db.from('product_categories').select('id, name').order('name'),
  ]);
  return (
    <div>
      <PageHeader title="Novo Produto" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Produtos', href: '/admin/produtos' }, { label: 'Novo' }]} />
      <ProdutoForm brands={brands ?? []} categories={categories ?? []} />
    </div>
  );
}
