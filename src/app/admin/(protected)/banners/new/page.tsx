import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { BannerForm } from '../BannerForm';
export default async function NewBannerPage() {
  await requireAdmin();
  return <div><PageHeader title="Novo Banner" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Banners', href: '/admin/banners' }, { label: 'Novo' }]} /><BannerForm /></div>;
}
