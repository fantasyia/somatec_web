import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { ReceitaForm } from '../ReceitaForm';
export default async function NewReceitaPage() {
  await requireAdmin();
  const { data: categories } = await getSupabaseAdminClient().from('recipe_categories').select('id, name').order('name');
  return <div><PageHeader title="Nova Receita" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Receitas', href: '/admin/receitas' }, { label: 'Nova' }]} /><ReceitaForm categories={categories ?? []} /></div>;
}
