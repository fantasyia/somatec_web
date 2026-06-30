-- =============================================================================
-- Row Level Security (RLS) — v1.0 §18 + adendo v1.1
--
-- Padrões:
--  - Admin: CRUD total (via is_admin())
--  - Público (anon + authenticated): leitura apenas onde status='published' OR active=true
--  - webhook_retry_queue, admin_activity_log: SOMENTE service_role bypass RLS
-- =============================================================================

-- Habilitar RLS em todas as tabelas públicas
alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.pages enable row level security;
alter table public.navigation_items enable row level security;
alter table public.home_hero enable row level security;
alter table public.home_slider_items enable row level security;
alter table public.home_indicators enable row level security;
alter table public.home_cta_cards enable row level security;
alter table public.banners enable row level security;
alter table public.solutions enable row level security;
alter table public.brands enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_applications enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_packaging_options enable row level security;
alter table public.product_application_links enable row level security;
alter table public.recipe_categories enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_products enable row level security;
alter table public.footer_columns enable row level security;
alter table public.footer_links enable row level security;
alter table public.webhook_retry_queue enable row level security;
alter table public.redirects enable row level security;
alter table public.admin_activity_log enable row level security;

-- -----------------------------------------------------------------------------
-- Policy macros via DO block: admin_all + public_read por tabela
-- -----------------------------------------------------------------------------

-- Helper para limpar policies antigas antes de recriar
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I;', r.policyname, r.tablename);
  end loop;
end;
$$;

-- ===== Admin full access em todas as tabelas =====
do $$
declare
  t text;
  tables text[] := array[
    'admin_profiles',
    'site_settings',
    'media_assets',
    'pages',
    'navigation_items',
    'home_hero',
    'home_slider_items',
    'home_indicators',
    'home_cta_cards',
    'banners',
    'solutions',
    'brands',
    'product_categories',
    'product_applications',
    'products',
    'product_images',
    'product_packaging_options',
    'product_application_links',
    'recipe_categories',
    'recipes',
    'recipe_products',
    'footer_columns',
    'footer_links',
    'webhook_retry_queue',
    'redirects',
    'admin_activity_log'
  ];
begin
  foreach t in array tables loop
    execute format($p$
      create policy "Admin full access on %I"
      on public.%I
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
    $p$, t, t);
  end loop;
end;
$$;

-- ===== Public read em tabelas com coluna status (apenas 'published') =====
do $$
declare
  t text;
  tables_status text[] := array[
    'pages',
    'solutions',
    'brands',
    'product_categories',
    'product_applications',
    'products',
    'recipe_categories',
    'recipes'
  ];
begin
  foreach t in array tables_status loop
    execute format($p$
      create policy "Public read published %I"
      on public.%I
      for select
      to anon, authenticated
      using (status = 'published');
    $p$, t, t);
  end loop;
end;
$$;

-- ===== Public read em tabelas com coluna active (apenas active=true) =====
do $$
declare
  t text;
  tables_active text[] := array[
    'navigation_items',
    'home_hero',
    'home_slider_items',
    'home_indicators',
    'home_cta_cards',
    'banners',
    'footer_columns',
    'footer_links',
    'product_images',
    'product_packaging_options'
  ];
begin
  foreach t in array tables_active loop
    execute format($p$
      create policy "Public read active %I"
      on public.%I
      for select
      to anon, authenticated
      using (active = true);
    $p$, t, t);
  end loop;
end;
$$;

-- ===== Public read em pivôs (junction tables) =====
-- Só leem se o lado "pai" tiver status published
create policy "Public read product_application_links"
on public.product_application_links
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_application_links.product_id
      and p.status = 'published'
  )
);

create policy "Public read recipe_products"
on public.recipe_products
for select
to anon, authenticated
using (
  exists (
    select 1 from public.recipes r
    where r.id = recipe_products.recipe_id
      and r.status = 'published'
  )
);

-- ===== site_settings: leitura pública é necessária (cookies, LGPD text) =====
-- Como cobre textos públicos do site, liberar SELECT para anon.
create policy "Public read site_settings"
on public.site_settings
for select
to anon, authenticated
using (true);

-- ===== media_assets: leitura pública (URLs públicas) =====
create policy "Public read media_assets"
on public.media_assets
for select
to anon, authenticated
using (bucket = 'site-public');

-- ===== redirects: middleware precisa ler ativos =====
create policy "Public read active redirects"
on public.redirects
for select
to anon, authenticated
using (active = true);

-- NOTA: webhook_retry_queue e admin_activity_log NÃO têm policy pública.
-- service_role bypassa RLS e é o único que escreve neles via API routes.
-- Admin lê via is_admin() (policy acima já cobre).
