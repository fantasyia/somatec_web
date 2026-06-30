import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { MarcaForm } from '../MarcaForm';

export const metadata: Metadata = { title: 'Editar Marca — Admin MSM' };

export default async function EditMarcaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = getSupabaseAdminClient();
  const { data } = await db.from('brands').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <PageHeader title={`Editar: ${data.name}`} breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Marcas', href: '/admin/marcas' }, { label: data.name }]} />
      <MarcaForm item={data} />
    </div>
  );
}
