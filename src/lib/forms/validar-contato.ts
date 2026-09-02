// =============================================================================
// Validação do formulário de contato, no CLIENTE.
//
// O formulário já tinha a UI de erro por campo, mas o estado `errors` só era
// ZERADO — nunca preenchido. Somado ao `noValidate` no <form>, isso deixava o
// /contato sem validação nenhuma no cliente: o asterisco vermelho prometia uma
// obrigatoriedade que não existia.
//
// O servidor continua sendo a AUTORIDADE (nome, e-mail, WhatsApp e o
// consentimento LGPD já são recusados lá — `lgpd_consent` é `z.literal(true)`,
// então nenhum lead é gravado sem consentimento). Isto aqui existe pra a
// pessoa ver o erro NO CAMPO, em vez de descobrir por uma mensagem genérica no
// rodapé depois da ida e volta.
//
// ⚠️ A exceção é o `publico`: no servidor ele é OPCIONAL, e continua sendo de
// propósito. Sem público o lead não ganha a etiqueta `publico:*` e o
// industrial cai no ramo genérico do fluxo — mas recusar o envio no servidor
// perderia o lead inteiro, e lead perdido é pior que lead mal roteado. Quem
// garante o público é esta validação, aqui na frente.
// =============================================================================

export type DadosContato = {
  nome: string;
  email: string;
  whatsapp: string;
  publico: string;
  lgpdAceito: boolean;
};

export type ErrosContato = Partial<Record<keyof DadosContato | 'lgpd_consent', string>>;

/** Só dígitos — a máscara não pode contar como número. É o que o servidor faz
 *  antes de medir o comprimento. */
export function apenasDigitos(v: string): string {
  return (v ?? '').replace(/\D/g, '');
}

/** Devolve um erro por campo. Vazio = pode enviar. */
export function validarContato(d: DadosContato): ErrosContato {
  const e: ErrosContato = {};
  const nome = (d.nome ?? '').trim();
  const email = (d.email ?? '').trim();

  if (nome.length < 2) e.nome = 'Nome é obrigatório';

  if (!email) e.email = 'E-mail é obrigatório';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = 'E-mail inválido';

  const zap = apenasDigitos(d.whatsapp ?? '');
  if (!zap) e.whatsapp = 'WhatsApp é obrigatório';
  else if (zap.length < 10 || zap.length > 13) e.whatsapp = 'WhatsApp inválido — inclua o DDD';

  // O buraco que originou o card: sem público não sai a etiqueta `publico:*`,
  // e o fluxo S manda o industrial pro ramo genérico sem que nada acuse.
  if (!(d.publico ?? '').trim()) e.publico = 'Escolha para quem é a proteção';

  if (!d.lgpdAceito) e.lgpd_consent = 'É preciso aceitar a Política de Privacidade';

  return e;
}

export function temErro(e: ErrosContato): boolean {
  return Object.keys(e).length > 0;
}
