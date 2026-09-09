import 'server-only';

/**
 * Escapa o que veio de fora antes de entrar no HTML do e-mail.
 *
 * Nome de cliente, descrição de item e forma de pagamento nascem em formulário
 * ou em resposta de gateway. Um `<` num desses quebra o e-mail — e, na pior
 * das hipóteses, injeta marcação na caixa de outra pessoa.
 *
 * Vive aqui, e não dentro de um dos e-mails, porque já são dois consumindo a
 * mesma regra: `pedido-confirmado.ts` e `pagamento-confirmado.ts`.
 */
export function escapar(v: string): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
