import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { MarcaForm } from '../MarcaForm';

export const metadata: Metadata = { title: 'Nova Marca — Admin MSM' };

export default async function NewMarcaPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader title="Nova Marca" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Marcas', href: '/admin/marcas' }, { label: 'Nova' }]} />
      <MarcaForm />
    </div>
  );
}
