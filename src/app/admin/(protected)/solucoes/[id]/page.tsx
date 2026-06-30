import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { SolucaoForm } from '../SolucaoForm';

export const metadata: Metadata = { title: 'Editar Solução — Admin MSM' };

export default async function EditSolucaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = getSupabaseAdminClient();
  const { data } = await db.from('solutions').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={`Editar: ${data.title}`}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Soluções', href: '/admin/solucoes' }, { label: data.title }]}
      />
      <SolucaoForm item={data} />
    </div>
  );
}
