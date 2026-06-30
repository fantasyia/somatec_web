-- =============================================================================
-- 015 — Reordenação atômica por display_order
--
-- Substitui os N UPDATEs paralelos (sem transação) do endpoint /api/admin/reorder
-- por uma RPC transacional: valida que TODOS os ids existem na tabela e seta
-- display_order = posição (0-based) no array. Falha parcial → rollback de tudo.
-- Idempotente (create or replace).
-- =============================================================================

create or replace function public.reorder_by_display_order(p_table text, p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_expected integer := coalesce(array_length(p_ids, 1), 0);
begin
  if v_expected = 0 then
    return 0;
  end if;

  -- Whitelist das tabelas gerenciadas pelo CMS (mesma do endpoint).
  if p_table not in (
    'home_slider_items', 'home_indicators', 'home_cta_cards',
    'banners', 'navigation_items', 'footer_links', 'footer_columns'
  ) then
    raise exception 'reorder: tabela nao permitida: %', p_table;
  end if;

  -- display_order = posição 0-based no array. A função roda em uma única
  -- transação, então isto é atômico (qualquer raise faz rollback de tudo).
  execute format(
    'update public.%I t
        set display_order = arr.ord - 1
       from unnest($1) with ordinality as arr(id, ord)
      where t.id = arr.id',
    p_table
  ) using p_ids;

  get diagnostics v_count = row_count;

  -- Todos os ids devem existir e pertencer à tabela; senão aborta.
  if v_count <> v_expected then
    raise exception 'reorder: % ids enviados, % linhas afetadas (id inexistente ou duplicado)', v_expected, v_count;
  end if;

  return v_count;
end;
$$;

-- Só o service_role (usado pelo endpoint admin autenticado) pode executar.
revoke all on function public.reorder_by_display_order(text, uuid[]) from public;
grant execute on function public.reorder_by_display_order(text, uuid[]) to service_role;
