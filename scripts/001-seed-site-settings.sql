-- =============================================================================
-- MSM — Seed idempotente de site_settings
-- Aplica defaults sensatos para as 4 chaves principais.
-- Usa ON CONFLICT DO NOTHING — re-rodar é seguro.
-- =============================================================================

INSERT INTO site_settings (key, value, description)
VALUES (
  'lgpd_consent_text',
  jsonb_build_object(
    'version', 'v1.0',
    'text',    'Ao enviar este formulário, você concorda com a coleta e tratamento dos dados informados para contato comercial, conforme nossa Política de Privacidade e a Lei Geral de Proteção de Dados (LGPD).'
  ),
  'Texto LGPD versionado. Usado em forms (hash sha256 enviado ao MullerBot).'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value, description)
VALUES (
  'cookie_banner_text',
  jsonb_build_object(
    'body',                  'Usamos cookies para melhorar sua experiência e analisar o uso do site. Você pode aceitar todos ou usar apenas os essenciais.',
    'accept_label',          'Aceitar cookies',
    'essential_only_label',  'Apenas essenciais'
  ),
  'Texto e labels do banner LGPD de cookies.'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value, description)
VALUES (
  'mullerbot_integration_status',
  jsonb_build_object(
    'last_health_check', null,
    'is_healthy',        true,
    'notes',             'Atualizado pelo painel admin de integração.'
  ),
  'Estado de saúde da integração com MullerBot (admin/integracao).'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value, description)
VALUES (
  'company_info',
  jsonb_build_object(
    'legal_name',  'MSM Alimentos',
    'cnpj',        null,
    'address',     null,
    'whatsapp',    null,
    'email',       'comercial@msm.com.br'
  ),
  'Informações jurídicas/comerciais da MSM. Usado em footer, contato e documentos legais.'
)
ON CONFLICT (key) DO NOTHING;
