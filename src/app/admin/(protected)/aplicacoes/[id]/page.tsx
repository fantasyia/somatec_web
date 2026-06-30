import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AplicacaoForm } from '../AplicacaoForm';
export default async function EditAplicacaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdminClient().from('product_applications').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <div><PageHeader title={`Editar: ${data.name}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Aplicações', href: '/admin/aplicacoes' }, { label: data.name }]} /><AplicacaoForm item={data} /></div>;
}
