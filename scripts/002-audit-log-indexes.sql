-- =============================================================================
-- MSM — Índices para admin_activity_log
--
-- A tabela cresce monotonicamente. Indexes melhoram:
--   1. Archive queries (filtro por created_at + delete)
--   2. UI do admin (lista por created_at desc)
--   3. Lookups por usuário e por tabela alvo
-- =============================================================================

-- Index BRIN para created_at (eficiente para tabelas append-only e queries
-- de range no archive). Muito menor que B-tree e suficiente para o caso de uso.
CREATE INDEX IF NOT EXISTS admin_activity_log_created_at_brin
  ON admin_activity_log USING BRIN (created_at);

-- Index B-tree desc para a query da UI (ordem reversa).
CREATE INDEX IF NOT EXISTS admin_activity_log_created_at_desc
  ON admin_activity_log (created_at DESC);

-- Lookups por usuário (audit por pessoa).
CREATE INDEX IF NOT EXISTS admin_activity_log_user_id_created_at
  ON admin_activity_log (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Lookups por tabela alvo (audit por entity).
CREATE INDEX IF NOT EXISTS admin_activity_log_table_record
  ON admin_activity_log (table_name, record_id, created_at DESC)
  WHERE table_name IS NOT NULL;

COMMENT ON INDEX admin_activity_log_created_at_brin IS
  'BRIN otimizado para archive job (range scan por created_at).';
