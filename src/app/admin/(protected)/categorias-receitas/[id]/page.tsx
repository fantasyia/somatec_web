import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { CatReceitaForm } from '../CatReceitaForm';
export default async function EditCatReceitaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdminClient().from('recipe_categories').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <div><PageHeader title={`Editar: ${data.name}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Cat. Receitas', href: '/admin/categorias-receitas' }, { label: data.name }]} /><CatReceitaForm item={data} /></div>;
}
