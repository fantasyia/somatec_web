-- =============================================================================
-- Triggers set_updated_at em todas as tabelas com coluna updated_at
-- =============================================================================

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
    'recipe_categories',
    'recipes',
    'footer_columns',
    'footer_links',
    'webhook_retry_queue',
    'redirects'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists trg_set_updated_at_%I on public.%I;',
      t, t
    );
    execute format(
      'create trigger trg_set_updated_at_%I
         before update on public.%I
         for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end;
$$;
