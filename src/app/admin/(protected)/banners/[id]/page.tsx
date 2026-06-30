import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { BannerForm } from '../BannerForm';
export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdminClient().from('banners').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <div><PageHeader title={`Editar: ${data.title}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Banners', href: '/admin/banners' }, { label: data.title }]} /><BannerForm item={data} /></div>;
}
