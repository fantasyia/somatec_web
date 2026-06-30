import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { RedirectForm } from '../RedirectForm';
export default async function NewRedirectPage() {
  await requireAdmin();
  return <div><PageHeader title="Novo Redirect" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Redirects', href: '/admin/redirects' }, { label: 'Novo' }]} /><RedirectForm /></div>;
}
