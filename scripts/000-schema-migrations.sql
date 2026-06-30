-- =============================================================================
-- MSM — Tabela de tracking de migrations aplicadas
-- Primeiro arquivo a rodar (prefixo 000). Idempotente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS _schema_migrations (
  id           text PRIMARY KEY,
  applied_at   timestamptz NOT NULL DEFAULT now(),
  duration_ms  integer,
  checksum     text
);

COMMENT ON TABLE _schema_migrations IS 'Tracking de migrations aplicadas pelo apply-seed.mjs.';
