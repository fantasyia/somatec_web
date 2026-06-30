-- =============================================================================
-- MSM — Seed da chave whatsapp_button em site_settings
--
-- Botão flutuante de WhatsApp do site. Editável via /admin/whatsapp.
-- Não é CRM — apenas abre wa.me com mensagem pré-preenchida.
-- =============================================================================

INSERT INTO site_settings (key, value, description)
VALUES (
  'whatsapp_button',
  jsonb_build_object(
    'enabled',  false,
    'number',   '',
    'message',  'Olá! Vim pelo site da MSM e gostaria de saber mais.'
  ),
  'Botão WhatsApp flutuante do site. Edite via /admin/whatsapp. CRM é em ferramenta separada.'
)
ON CONFLICT (key) DO NOTHING;
