import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { AplicacaoForm } from '../AplicacaoForm';
export default async function NewAplicacaoPage() {
  await requireAdmin();
  return <div><PageHeader title="Nova Aplicação" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Aplicações', href: '/admin/aplicacoes' }, { label: 'Nova' }]} /><AplicacaoForm /></div>;
}
