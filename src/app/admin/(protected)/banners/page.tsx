import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { BannersListClient } from './BannersListClient';

export const metadata: Metadata = { title: 'Banners — Admin Somatec' };

type BannerRow = {
  id: string;
  title: string;
  location: string;
  route_path: string | null;
  active: boolean;
  display_order: number;
};

export default async function BannersPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const { data } = await db
    .from('banners')
    .select('id, title, location, route_path, active, display_order')
    .order('display_order');
  const rows = (data as unknown as BannerRow[] | null) ?? [];

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Arraste pra reordenar."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Banners' }]}
        action={<Link href="/admin/banners/new" className="admin-btn-primary">+ Novo banner</Link>}
      />
      <div className="p-6 lg:p-8">
        <BannersListClient items={rows} />
      </div>
    </div>
  );
}
