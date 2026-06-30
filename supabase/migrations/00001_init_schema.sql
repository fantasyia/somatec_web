-- =============================================================================
-- MSM Site — Schema inicial (v1.0 + Adendo v1.1)
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- (is_admin é criada no fim do arquivo, depois que admin_profiles existe)

-- -----------------------------------------------------------------------------
-- Admin & site config
-- -----------------------------------------------------------------------------

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'site-public',
  path text not null,
  public_url text,
  file_name text,
  file_type text,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  title text,
  description text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Pages & navigation
-- -----------------------------------------------------------------------------

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  route_path text not null unique,
  page_type text not null default 'institutional',
  status text not null default 'draft',
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  content jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  robots_index boolean not null default false,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  parent_id uuid references public.navigation_items(id) on delete cascade,
  location text not null default 'header',
  display_order int not null default 0,
  active boolean not null default true,
  is_external boolean not null default false,
  open_in_new_tab boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Home modules
-- -----------------------------------------------------------------------------

create table if not exists public.home_hero (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  video_url text,
  fallback_image_url text,
  mobile_fallback_image_url text,
  primary_cta_label text,
  primary_cta_url text,
  secondary_cta_label text,
  secondary_cta_url text,
  overlay_opacity numeric(3,2) not null default 0.45,
  active boolean not null default true,
  seo_support_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_slider_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  image_url text,
  mobile_image_url text,
  cta_label text,
  cta_url text,
  display_order int not null default 0,
  transition_seconds int not null default 7,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_indicators (
  id uuid primary key default gen_random_uuid(),
  main_text text not null,
  description text,
  icon_url text,
  internal_note text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_cta_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon_url text,
  interest_type text,
  button_label text,
  button_url text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  location text not null,
  route_path text,
  desktop_image_url text,
  mobile_image_url text,
  video_url text,
  cta_label text,
  cta_url text,
  overlay_style text default 'dark',
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Commercial: solutions
-- -----------------------------------------------------------------------------

create table if not exists public.solutions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  route_path text not null unique,
  short_description text,
  full_content jsonb not null default '{}'::jsonb,
  hero_image_url text,
  icon_url text,
  benefits jsonb not null default '[]'::jsonb,
  cta_label text,
  cta_url text,
  form_interest_type text,
  status text not null default 'draft',
  display_order int not null default 0,
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  robots_index boolean not null default false,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Brands
-- -----------------------------------------------------------------------------

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  logo_url text,
  cover_image_url text,
  positioning text,
  target_audience text,
  categories jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  display_order int not null default 0,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  robots_index boolean not null default false,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references public.product_categories(id) on delete set null,
  display_order int not null default 0,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  robots_index boolean not null default false,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order int not null default 0,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  robots_index boolean not null default false,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.product_categories(id) on delete set null,
  short_description text,
  full_description text,
  main_image_url text,
  technical_sheet_url text,
  packaging_summary text,
  commercial_notes text,
  featured boolean not null default false,
  display_order int not null default 0,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  robots_index boolean not null default false,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_packaging_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  description text,
  weight_or_volume text,
  units_per_box text,
  image_url text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_application_links (
  product_id uuid not null references public.products(id) on delete cascade,
  application_id uuid not null references public.product_applications(id) on delete cascade,
  primary key (product_id, application_id)
);

-- -----------------------------------------------------------------------------
-- Recipes
-- -----------------------------------------------------------------------------

create table if not exists public.recipe_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order int not null default 0,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  robots_index boolean not null default false,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category_id uuid references public.recipe_categories(id) on delete set null,
  short_description text,
  introduction text,
  image_url text,
  prep_time text,
  cook_time text,
  total_time text,
  yield_text text,
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  chef_notes text,
  application_context text,
  featured boolean not null default false,
  display_order int not null default 0,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  robots_index boolean not null default false,
  robots_follow boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipe_products (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (recipe_id, product_id)
);

-- -----------------------------------------------------------------------------
-- Footer
-- -----------------------------------------------------------------------------

create table if not exists public.footer_columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.footer_links (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.footer_columns(id) on delete cascade,
  label text not null,
  href text not null,
  is_external boolean not null default false,
  open_in_new_tab boolean not null default false,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- v1.1: Webhook queue (NÃO é tabela de leads — fila técnica de transporte)
-- -----------------------------------------------------------------------------

create table if not exists public.webhook_retry_queue (
  id uuid primary key default gen_random_uuid(),
  destination text not null default 'mullerbot',
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending',
  attempts int not null default 0,
  max_attempts int not null default 5,
  last_error text,
  last_attempted_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  source_page text,
  source_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webhook_queue_status_next
  on public.webhook_retry_queue(status, next_attempt_at)
  where status in ('pending', 'failed');

create index if not exists idx_webhook_queue_created
  on public.webhook_retry_queue(created_at desc);

-- -----------------------------------------------------------------------------
-- v1.1: Redirects (preservação de SEO)
-- -----------------------------------------------------------------------------

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code int not null default 301,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_redirects_active_from
  on public.redirects(active, from_path);

-- -----------------------------------------------------------------------------
-- v1.1: Admin activity log (auditoria)
-- -----------------------------------------------------------------------------

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  action text not null,
  table_name text,
  record_id uuid,
  record_label text,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_user
  on public.admin_activity_log(user_id);
create index if not exists idx_activity_table_record
  on public.admin_activity_log(table_name, record_id);
create index if not exists idx_activity_created
  on public.admin_activity_log(created_at desc);

-- -----------------------------------------------------------------------------
-- Indexes complementares (v1.0 §19)
-- -----------------------------------------------------------------------------

create index if not exists idx_pages_slug on public.pages(slug);
create index if not exists idx_pages_route on public.pages(route_path);
create index if not exists idx_pages_status on public.pages(status);

create index if not exists idx_solutions_slug on public.solutions(slug);
create index if not exists idx_solutions_route on public.solutions(route_path);
create index if not exists idx_solutions_status on public.solutions(status);

create index if not exists idx_brands_slug on public.brands(slug);
create index if not exists idx_brands_status on public.brands(status);
create index if not exists idx_brands_featured on public.brands(featured) where featured = true;

create index if not exists idx_product_categories_slug on public.product_categories(slug);
create index if not exists idx_product_categories_status on public.product_categories(status);

create index if not exists idx_product_applications_slug on public.product_applications(slug);
create index if not exists idx_product_applications_status on public.product_applications(status);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_brand on public.products(brand_id);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_featured on public.products(featured) where featured = true;

create index if not exists idx_recipe_categories_slug on public.recipe_categories(slug);
create index if not exists idx_recipe_categories_status on public.recipe_categories(status);

create index if not exists idx_recipes_slug on public.recipes(slug);
create index if not exists idx_recipes_status on public.recipes(status);
create index if not exists idx_recipes_category on public.recipes(category_id);
create index if not exists idx_recipes_featured on public.recipes(featured) where featured = true;

create index if not exists idx_banners_location on public.banners(location, active);

-- -----------------------------------------------------------------------------
-- Função is_admin (após admin_profiles existir)
-- -----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
      and ap.active = true
  );
$$;
