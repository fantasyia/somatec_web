import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { ReceitaForm } from '../ReceitaForm';
export default async function EditReceitaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = getSupabaseAdminClient();
  const [{ data }, { data: categories }] = await Promise.all([
    db.from('recipes').select('*').eq('id', id).maybeSingle(),
    db.from('recipe_categories').select('id, name').order('name'),
  ]);
  if (!data) notFound();
  return <div><PageHeader title={`Editar: ${data.title}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Receitas', href: '/admin/receitas' }, { label: data.title }]} /><ReceitaForm item={data} categories={categories ?? []} /></div>;
}
