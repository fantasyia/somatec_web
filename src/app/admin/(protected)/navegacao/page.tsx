import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { NavegacaoListClient } from './NavegacaoListClient';

export const metadata: Metadata = { title: 'Navegação — Admin MSM' };

type NavRow = {
  id: string;
  label: string;
  href: string;
  location: string;
  display_order: number;
  active: boolean;
};

export default async function NavegacaoPage() {
  await requireAdmin();
  const { data } = await getSupabaseAdminClient()
    .from('navigation_items')
    .select('id, label, href, location, display_order, active')
    .order('location')
    .order('display_order');
  const rows = (data as unknown as NavRow[] | null) ?? [];

  return (
    <div>
      <PageHeader
        title="Navegação"
        description="Itens do menu header e footer. Arraste pra reordenar dentro do mesmo local."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Navegação' }]}
        action={<Link href="/admin/navegacao/new" className="admin-btn-primary">+ Novo item</Link>}
      />
      <div className="p-6 lg:p-8">
        <NavegacaoListClient items={rows} />
      </div>
    </div>
  );
}
