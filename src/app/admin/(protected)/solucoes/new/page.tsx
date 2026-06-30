import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { SolucaoForm } from '../SolucaoForm';

export const metadata: Metadata = { title: 'Nova Solução — Admin MSM' };

export default async function NewSolucaoPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader
        title="Nova Solução"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Soluções', href: '/admin/solucoes' }, { label: 'Nova' }]}
      />
      <SolucaoForm />
    </div>
  );
}
