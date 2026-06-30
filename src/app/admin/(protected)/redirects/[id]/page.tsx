import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { RedirectForm } from '../RedirectForm';
export default async function EditRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdminClient().from('redirects').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <div><PageHeader title={`Editar: ${data.from_path}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Redirects', href: '/admin/redirects' }, { label: data.from_path }]} /><RedirectForm item={data} /></div>;
}
