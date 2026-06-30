import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProdutoForm } from '../ProdutoForm';

export default async function EditProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = getSupabaseAdminClient();
  const [{ data }, { data: brands }, { data: categories }] = await Promise.all([
    db.from('products').select('*').eq('id', id).maybeSingle(),
    db.from('brands').select('id, name').order('name'),
    db.from('product_categories').select('id, name').order('name'),
  ]);
  if (!data) notFound();
  return (
    <div>
      <PageHeader title={`Editar: ${data.name}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Produtos', href: '/admin/produtos' }, { label: data.name }]} />
      <ProdutoForm item={data} brands={brands ?? []} categories={categories ?? []} />
    </div>
  );
}
