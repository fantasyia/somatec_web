import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { PaginaForm } from '../PaginaForm';
export default async function EditPaginaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdminClient().from('pages').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <div><PageHeader title={`Editar: ${data.title}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Páginas', href: '/admin/paginas' }, { label: data.title }]} /><PaginaForm item={data} /></div>;
}
