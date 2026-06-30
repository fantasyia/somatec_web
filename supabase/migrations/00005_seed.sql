-- =============================================================================
-- Seed inicial — site_settings essenciais
-- =============================================================================

insert into public.site_settings (key, value, description) values
  (
    'lgpd_consent_text',
    jsonb_build_object(
      'version', 'v1.0',
      'text', 'Ao enviar este formulário, você concorda com a coleta e tratamento dos dados informados para contato comercial, conforme nossa Política de Privacidade e a Lei Geral de Proteção de Dados (LGPD).'
    ),
    'Texto exibido nos formulários públicos para aceite LGPD. Incrementar version quando o texto mudar.'
  ),
  (
    'cookie_banner_text',
    jsonb_build_object(
      'title', 'Sua privacidade é importante',
      'body', 'Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para entender como você usa nossa plataforma. Você pode escolher quais aceitar.',
      'accept_label', 'Aceitar todos',
      'essential_only_label', 'Apenas essenciais',
      'manage_label', 'Gerenciar preferências'
    ),
    'Texto do banner de cookies LGPD'
  ),
  (
    'mullerbot_integration_status',
    jsonb_build_object(
      'configured', false,
      'last_check', null
    ),
    'Status da integração MullerBot. Atualizado automaticamente pelo painel de saúde.'
  ),
  (
    'company_info',
    jsonb_build_object(
      'legal_name', 'MSM Alimentos',
      'display_name', 'MSM',
      'cnpj', null,
      'address', null,
      'commercial_email', 'comercial@msm.com.br',
      'commercial_whatsapp', null
    ),
    'Dados institucionais da empresa exibidos no footer e em metadados.'
  )
on conflict (key) do nothing;
