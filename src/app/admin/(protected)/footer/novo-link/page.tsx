import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { FooterLinkForm } from '../FooterLinkForm';

export default async function NewFooterLinkPage() {
  await requireAdmin();
  const { data: columns } = await getSupabaseAdminClient().from('footer_columns').select('id, title').order('display_order');
  return <div><PageHeader title="Novo Link do Footer" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Footer', href: '/admin/footer' }, { label: 'Novo Link' }]} /><FooterLinkForm columns={columns ?? []} /></div>;
}
