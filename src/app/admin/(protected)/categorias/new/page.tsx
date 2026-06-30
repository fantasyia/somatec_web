import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { CategoriaForm } from '../CategoriaForm';
export default async function NewCategoriaPage() {
  await requireAdmin();
  return <div><PageHeader title="Nova Categoria" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Categorias', href: '/admin/categorias' }, { label: 'Nova' }]} /><CategoriaForm /></div>;
}
