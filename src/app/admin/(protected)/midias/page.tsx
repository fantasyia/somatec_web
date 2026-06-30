import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { MidiasClient } from './MidiasClient';

export const metadata: Metadata = { title: 'Mídias — Admin MSM' };

export default async function MidiasPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const { data: assets } = await db
    .from('media_assets')
    .select('id, file_name, mime_type, public_url, alt_text, size_bytes, created_at, bucket')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader
        title="Mídias"
        description="Upload e gestão de arquivos no Supabase Storage"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Mídias' }]}
      />
      <MidiasClient assets={assets ?? []} />
    </div>
  );
}
