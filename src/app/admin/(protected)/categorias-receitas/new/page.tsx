import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { CatReceitaForm } from '../CatReceitaForm';
export default async function NewCatReceitaPage() {
  await requireAdmin();
  return <div><PageHeader title="Nova Categoria de Receita" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Cat. Receitas', href: '/admin/categorias-receitas' }, { label: 'Nova' }]} /><CatReceitaForm /></div>;
}
