import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfiguracoesForm } from './ConfiguracoesForm';

export const metadata: Metadata = { title: 'Configurações — Admin Somatec' };

const KEYS = ['company_info', 'socials', 'lgpd_consent_text', 'cookie_banner_text', 'certifications'] as const;

type SettingRow = { key: string; value: unknown };

export default async function ConfiguracoesPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();

  const { data } = await db
    .from('site_settings')
    .select('key, value')
    .in('key', [...KEYS]);
  const rows = (data as unknown as SettingRow[] | null) ?? [];
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Dados institucionais, redes sociais e textos legais. SEO global fica em /admin/seo."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Configurações' }]}
      />
      <div className="p-6 lg:p-8 max-w-3xl">
        <ConfiguracoesForm
          initial={{
            company_info: (map['company_info'] as never) ?? null,
            socials: (map['socials'] as never) ?? null,
            lgpd_consent_text: (map['lgpd_consent_text'] as never) ?? null,
            cookie_banner_text: (map['cookie_banner_text'] as never) ?? null,
            certifications: (map['certifications'] as never) ?? null,
          }}
        />
      </div>
    </div>
  );
}
