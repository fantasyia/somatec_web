import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { NavItemForm } from '../NavItemForm';
export default async function NewNavItemPage() {
  await requireAdmin();
  return <div><PageHeader title="Novo Item de Navegação" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Navegação', href: '/admin/navegacao' }, { label: 'Novo' }]} /><NavItemForm /></div>;
}
