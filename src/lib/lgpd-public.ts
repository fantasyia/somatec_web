// Texto LGPD padrão acessível também pelo client (sem dependência de Supabase admin).
// Server lê a versão atual em site_settings via src/lib/lgpd.ts.

export const LGPD_PUBLIC_DEFAULT = {
  version: 'v1.0',
  text:
    'Ao enviar este formulário, você concorda com a coleta e tratamento dos dados informados para contato comercial, conforme nossa Política de Privacidade e a Lei Geral de Proteção de Dados (LGPD).',
} as const;
