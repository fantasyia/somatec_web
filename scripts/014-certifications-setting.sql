-- =============================================================================
-- Migration 014: seed site_settings.certifications
--
-- Popula a key com os 4 selos placeholder (FSSC 22000, BRCGS, ISO 9001, Halal)
-- apontando para os SVGs em public/certifications/. O admin
-- (/admin/configuracoes → Certificações) edita esta lista; o Footer consome
-- via getCertifications() com fallback pros mesmos 4 se a key estiver vazia.
--
-- Léo substitui os SVGs placeholder pelos logos oficiais e/ou edita os
-- labels/URLs no admin.
--
-- Idempotente: ON CONFLICT (key) DO NOTHING — não sobrescreve edições do admin.
-- =============================================================================

INSERT INTO site_settings (key, value, description)
VALUES (
  'certifications',
  '[
    {"label": "FSSC 22000", "src": "/certifications/fssc-22000.svg"},
    {"label": "BRCGS", "src": "/certifications/brcgs.svg"},
    {"label": "ISO 9001", "src": "/certifications/iso-9001.svg"},
    {"label": "Halal", "src": "/certifications/halal.svg"}
  ]'::jsonb,
  'Selos de certificação exibidos no footer (editável em /admin/configuracoes).'
)
ON CONFLICT (key) DO NOTHING;
