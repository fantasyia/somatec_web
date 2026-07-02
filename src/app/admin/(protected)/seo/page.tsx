import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { SeoForm } from './SeoForm';

export const metadata: Metadata = { title: 'SEO Global — Admin Somatec' };

const KEYS = [
  'seo_global_title',
  'seo_global_title_template',
  'seo_global_description',
  'seo_og_default_title',
  'seo_og_default_description',
  'seo_og_default_image',
  'seo_twitter_handle',
  'seo_google_analytics_id',
  'seo_robots_index',
  'seo_robots_follow',
] as const;

type Row = { key: string; value: unknown };

export default async function SeoPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();
  const { data } = await db.from('site_settings').select('key, value').in('key', [...KEYS]);
  const rows = (data as unknown as Row[] | null) ?? [];
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <PageHeader
        title="SEO Global"
        description="Valores padrão de SEO/OG. Páginas específicas (Produtos, Receitas, Soluções, Páginas) sobrescrevem esses defaults."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'SEO' }]}
      />
      <div className="p-6 lg:p-8 max-w-3xl">
        <SeoForm
          initial={{
            seo_global_title: (map['seo_global_title'] as string | null) ?? null,
            seo_global_title_template: (map['seo_global_title_template'] as string | null) ?? null,
            seo_global_description: (map['seo_global_description'] as string | null) ?? null,
            seo_og_default_title: (map['seo_og_default_title'] as string | null) ?? null,
            seo_og_default_description: (map['seo_og_default_description'] as string | null) ?? null,
            seo_og_default_image: (map['seo_og_default_image'] as string | null) ?? null,
            seo_twitter_handle: (map['seo_twitter_handle'] as string | null) ?? null,
            seo_google_analytics_id: (map['seo_google_analytics_id'] as string | null) ?? null,
            seo_robots_index: (map['seo_robots_index'] as boolean | null) ?? null,
            seo_robots_follow: (map['seo_robots_follow'] as boolean | null) ?? null,
          }}
        />
      </div>
    </div>
  );
}
