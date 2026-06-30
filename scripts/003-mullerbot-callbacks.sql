-- =============================================================================
-- MSM — Tabela mullerbot_callbacks
--
-- Recebe POSTs do MullerBot para o site avisando status de leads:
--   - lead_received: confirmação que processou
--   - lead_responded: operador respondeu o cliente
--   - delivery_failed: WhatsApp/canal falhou
--
-- HMAC-SHA256 valida origem via header X-MSM-Signature (MULLERBOT_SIGNING_SECRET).
-- Idempotency via idempotency_key UNIQUE — replay de callback retorna 200 sem
-- duplicar.
-- =============================================================================

CREATE TABLE IF NOT EXISTS mullerbot_callbacks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  event_type      text NOT NULL,
  source_ip       text,
  signature_ok    boolean NOT NULL DEFAULT false,
  payload         jsonb NOT NULL,
  received_at     timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz
);

COMMENT ON TABLE mullerbot_callbacks IS
  'Callbacks inbound do MullerBot (lead status updates). Idempotência por idempotency_key.';

COMMENT ON COLUMN mullerbot_callbacks.signature_ok IS
  'True se HMAC X-MSM-Signature validou contra MULLERBOT_SIGNING_SECRET.';

COMMENT ON COLUMN mullerbot_callbacks.processed_at IS
  'Marca quando consumido por job assíncrono — null = pendente. Reservado para uso futuro.';

-- Index BRIN para listas por data (cresce monotonicamente)
CREATE INDEX IF NOT EXISTS mullerbot_callbacks_received_at_brin
  ON mullerbot_callbacks USING BRIN (received_at);

-- Index B-tree para filtros por event_type + data (UI / queries de analytics)
CREATE INDEX IF NOT EXISTS mullerbot_callbacks_event_type_received_at
  ON mullerbot_callbacks (event_type, received_at DESC);

-- Index para callbacks pendentes de processamento
CREATE INDEX IF NOT EXISTS mullerbot_callbacks_unprocessed
  ON mullerbot_callbacks (received_at)
  WHERE processed_at IS NULL;
