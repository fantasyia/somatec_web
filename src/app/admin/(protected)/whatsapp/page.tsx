import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  WHATSAPP_BUTTON_DEFAULT,
  whatsAppButtonSchema,
  type WhatsAppButtonConfig,
} from '@/lib/whatsapp-button';
import { WhatsAppForm } from './WhatsAppForm';

export const metadata: Metadata = { title: 'WhatsApp — Admin MSM' };
export const dynamic = 'force-dynamic';

export default async function WhatsAppAdminPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();

  const { data } = await db
    .from('site_settings')
    .select('value, updated_at')
    .eq('key', 'whatsapp_button')
    .maybeSingle();

  const row = data as unknown as { value: unknown; updated_at: string } | null;
  const parsed = row ? whatsAppButtonSchema.safeParse(row.value) : null;
  const current: WhatsAppButtonConfig =
    parsed?.success ? parsed.data : WHATSAPP_BUTTON_DEFAULT;

  return (
    <div>
      <PageHeader
        title="Botão WhatsApp"
        description="Botão flutuante que aparece em todas as páginas do site público. Mensagem é pré-preenchida na conversa."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'WhatsApp' }]}
      />
      <div className="p-6 lg:p-8 max-w-2xl">
        <WhatsAppForm
          initial={current}
          updatedAt={row?.updated_at ?? null}
        />
      </div>
    </div>
  );
}
