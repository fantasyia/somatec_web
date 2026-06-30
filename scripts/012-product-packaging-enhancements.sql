-- =============================================================================
-- Migration 012: enhancements em product_packaging_options
--
-- Adiciona campos pedidos no admin (B.2):
--   - weight_grams int — peso em gramas (numérico) pra cálculo/comparação;
--     complementa o weight_or_volume (text livre, ex: "5L", "2,5kg") que
--     continua sendo o display principal.
--   - is_primary boolean — marca a embalagem principal/default exibida em
--     destaque. Apenas informativo (não há constraint de unicidade).
-- =============================================================================

alter table public.product_packaging_options
  add column if not exists weight_grams int;

alter table public.product_packaging_options
  add column if not exists is_primary boolean not null default false;

-- Índice parcial pra encontrar rapidamente a embalagem principal de um produto
create index if not exists idx_packaging_primary_per_product
  on public.product_packaging_options (product_id)
  where is_primary = true;
