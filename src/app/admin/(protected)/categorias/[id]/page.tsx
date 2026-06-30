import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { CategoriaForm } from '../CategoriaForm';
export default async function EditCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdminClient().from('product_categories').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <div><PageHeader title={`Editar: ${data.name}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Categorias', href: '/admin/categorias' }, { label: data.name }]} /><CategoriaForm item={data} /></div>;
}
