import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { HomeAdminTabs } from './HomeAdminTabs';

export const metadata: Metadata = { title: 'Home — Admin Somatec' };

export default async function HomeAdminPage() {
  await requireAdmin();
  const db = getSupabaseAdminClient();

  const [hero, slider, indicators, ctaCards] = await Promise.all([
    db.from('home_hero').select('*').order('created_at').limit(1).maybeSingle(),
    db.from('home_slider_items').select('*').order('display_order'),
    db.from('home_indicators').select('*').order('display_order'),
    db.from('home_cta_cards').select('*').order('display_order'),
  ]);

  return (
    <div>
      <PageHeader
        title="Home"
        description="Hero, carrossel, indicadores e cards de CTA"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Home' }]}
      />
      <HomeAdminTabs
        hero={hero.data}
        slider={slider.data ?? []}
        indicators={indicators.data ?? []}
        ctaCards={ctaCards.data ?? []}
      />
    </div>
  );
}
