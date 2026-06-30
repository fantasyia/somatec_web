import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { NavItemForm } from '../NavItemForm';
export default async function EditNavItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdminClient().from('navigation_items').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <div><PageHeader title={`Editar: ${data.label}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Navegação', href: '/admin/navegacao' }, { label: data.label }]} /><NavItemForm item={data} /></div>;
}
