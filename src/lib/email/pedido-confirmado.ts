import 'server-only';

import { CONTACT, SITE, whatsappHref } from '@/lib/constants/site';
import { formatarBRL, type ItemPedido } from '@/lib/pedidos/tipos';

// =============================================================================
// E-mail de confirmação do pedido.
//
// A função dele é UMA: entregar o número. A tela do checkout já mostrou, mas
// quem fecha o pedido e sai da página perde — e aí a única saída vira mandar
// mensagem no WhatsApp perguntando "e meu pedido?".
//
// Por isso o número aparece grande, no topo, e também no assunto: cliente que
// nem abre o e-mail consegue achar o pedido só pela busca da caixa de entrada.
//
// HTML de e-mail não é HTML de site: nada de flexbox, grid ou classe. É tabela
// e estilo em linha, que é o que Gmail, Outlook e Apple Mail renderizam igual.
// =============================================================================

const NAVY = '#00416E';
const CIANO = '#008CC8';
const TEXTO = '#1B2A38';
const SUAVE = '#5A6B7C';
const BORDA = '#DCE4EC';

export type DadosEmailPedido = {
  numero: string;
  nome: string;
  itens: ItemPedido[];
  totalCentavos: number;
  freteCentavos: number;
  formaPagamento?: string | null;
  cidade?: string | null;
  uf?: string | null;
};

function primeiroNome(nome: string): string {
  return String(nome || '').trim().split(/\s+/)[0] || '';
}

function linkDoPedido(numero: string): string {
  return `${SITE.url}/pedido/${numero}`;
}

export function assuntoPedido(numero: string): string {
  // O número no assunto é o que faz a busca da caixa de entrada funcionar.
  return `Pedido ${numero} recebido — Somatec Blocking`;
}

export function textoPedido(d: DadosEmailPedido): string {
  const linhas = [
    `Olá, ${primeiroNome(d.nome)}!`,
    '',
    'Recebemos o seu pedido. Guarde este número — é com ele que você acompanha a entrega:',
    '',
    `    ${d.numero}`,
    '',
    `Acompanhe em: ${linkDoPedido(d.numero)}`,
    '',
    'Resumo:',
    ...d.itens.map(
      (i) =>
        `  - ${i.quantidade > 1 ? `${i.quantidade}x ` : ''}${i.descricao}` +
        `${i.modelo ? ` (${i.modelo})` : ''} — ${formatarBRL(i.precoCentavos * (i.quantidade || 1))}`,
    ),
    `  Frete: ${d.freteCentavos === 0 ? 'grátis' : formatarBRL(d.freteCentavos)}`,
    `  Total: ${formatarBRL(d.totalCentavos)}`,
    ...(d.formaPagamento ? [`  Pagamento: ${d.formaPagamento}`] : []),
    '',
    'Nossa equipe entra em contato para finalizar o pedido com você.',
    '',
    `Dúvidas? Chame no WhatsApp: ${CONTACT.whatsappDisplay}`,
    '',
    'Somatec Blocking',
  ];
  return linhas.join('\n');
}

export function htmlPedido(d: DadosEmailPedido): string {
  const itens = d.itens
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BORDA};font-size:15px;color:${TEXTO};">
            ${i.quantidade > 1 ? `${i.quantidade}&times; ` : ''}${escapar(i.descricao)}
            ${i.modelo ? `<br><span style="font-size:13px;color:${SUAVE};">${escapar(i.modelo)}</span>` : ''}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BORDA};font-size:15px;color:${TEXTO};text-align:right;white-space:nowrap;">
            ${formatarBRL(i.precoCentavos * (i.quantidade || 1))}
          </td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${assuntoPedido(d.numero)}</title></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <!-- Pré-cabeçalho: é o texto que aparece na lista de e-mails, ao lado do
       assunto. Sem ele, o cliente vê o começo do HTML. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Seu número de pedido é ${d.numero}. Guarde para acompanhar a entrega.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;">

        <tr><td style="background:${NAVY};padding:22px 28px;">
          <span style="color:#FFFFFF;font-size:17px;font-weight:700;letter-spacing:.5px;">SOMATEC BLOCKING</span>
        </td></tr>

        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 6px;font-size:16px;color:${TEXTO};">Olá, ${escapar(primeiroNome(d.nome))}!</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${SUAVE};">
            Recebemos o seu pedido. Guarde o número abaixo — é com ele que você acompanha a entrega.
          </p>
        </td></tr>

        <!-- O número é o motivo deste e-mail existir: vem grande e sozinho. -->
        <tr><td style="padding:18px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,140,200,.06);border:1px solid rgba(0,140,200,.3);border-radius:10px;">
            <tr><td align="center" style="padding:20px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.6px;color:${CIANO};text-transform:uppercase;">Número do pedido</div>
              <div style="margin-top:8px;font-size:26px;font-weight:700;letter-spacing:2px;color:${TEXTO};">${d.numero}</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:0 28px 22px;">
          <a href="${linkDoPedido(d.numero)}" style="display:inline-block;background:${CIANO};color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:13px 26px;border-radius:8px;">
            Acompanhar meu pedido
          </a>
        </td></tr>

        <tr><td style="padding:0 28px 8px;">
          <div style="font-size:13px;font-weight:700;color:${TEXTO};text-transform:uppercase;letter-spacing:.6px;">Resumo</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            ${itens}
            <tr>
              <td style="padding:10px 0 0;font-size:14px;color:${SUAVE};">Frete</td>
              <td style="padding:10px 0 0;font-size:14px;color:${TEXTO};text-align:right;">${d.freteCentavos === 0 ? 'Grátis' : formatarBRL(d.freteCentavos)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:${TEXTO};">Total</td>
              <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:${TEXTO};text-align:right;">${formatarBRL(d.totalCentavos)}</td>
            </tr>
            ${d.formaPagamento ? `<tr><td style="padding:6px 0 0;font-size:14px;color:${SUAVE};">Pagamento</td><td style="padding:6px 0 0;font-size:14px;color:${TEXTO};text-align:right;">${escapar(d.formaPagamento)}</td></tr>` : ''}
          </table>
          ${d.cidade && d.uf ? `<p style="margin:14px 0 0;font-size:14px;color:${SUAVE};">Entrega em ${escapar(d.cidade)}/${escapar(d.uf)}.</p>` : ''}
        </td></tr>

        <tr><td style="padding:20px 28px 26px;">
          <p style="margin:0;font-size:14px;line-height:1.65;color:${SUAVE};">
            Nossa equipe entra em contato para finalizar o pedido com você.
            Qualquer dúvida, é só
            <a href="${whatsappHref(`Olá! Tenho uma dúvida sobre o pedido ${d.numero}.`)}" style="color:${CIANO};text-decoration:underline;">chamar no WhatsApp</a>.
          </p>
        </td></tr>

        <tr><td style="background:#F5F5F5;padding:16px 28px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${SUAVE};">
            Somatec Blocking — proteção elétrica e qualidade de energia.<br>
            Você recebeu este e-mail porque fez um pedido no nosso site.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** O nome do cliente e a descrição do item vêm de formulário — entram no HTML
 *  escapados, senão um `<` no nome quebra o e-mail (ou pior). */
function escapar(v: string): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
