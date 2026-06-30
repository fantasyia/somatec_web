import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { PaginaForm } from '../PaginaForm';
export default async function NewPaginaPage() {
  await requireAdmin();
  return <div><PageHeader title="Nova Página" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Páginas', href: '/admin/paginas' }, { label: 'Nova' }]} /><PaginaForm /></div>;
}
