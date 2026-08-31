// Texto LGPD padrão acessível também pelo client (sem dependência de Supabase admin).
// Server lê a versão atual em site_settings via src/lib/lgpd.ts.

export const LGPD_PUBLIC_DEFAULT = {
  version: 'v1.0',
  text:
    'Ao enviar este formulário, você concorda com a coleta e tratamento dos dados informados para contato comercial, conforme nossa Política de Privacidade e a Lei Geral de Proteção de Dados (LGPD).',
} as const;

/** Aviso do passo de CONTATO — consentimento IMPLÍCITO: a pessoa consente ao
 *  preencher, sem marcar caixa nenhuma.
 *
 *  Versão própria de propósito. O que prova o consentimento numa auditoria é o
 *  texto que a pessoa viu, e aqui ela viu OUTRO texto, num momento diferente
 *  do funil. Reaproveitar a versão do checkbox misturaria os dois padrões e
 *  tornaria impossível separar depois quem aceitou o quê.
 *
 *  Texto definido pelo Léo (31/08). */
export const LGPD_PUBLIC_IMPLICITO = {
  version: 'v1.0-implicito',
  text:
    'Ao preencher seus dados você concorda com nossa Política de Privacidade e autoriza o contato da nossa equipe. Você pode pedir a exclusão a qualquer momento.',
} as const;
