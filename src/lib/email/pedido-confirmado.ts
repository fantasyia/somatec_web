import 'server-only';

import { CONTACT, SITE, whatsappHref } from '@/lib/constants/site';
import { formatarBRL, type ItemPedido } from '@/lib/pedidos/tipos';
import { escapar } from '@/lib/email/html';
import { CORES, botao, layoutEmail } from '@/lib/email/layout';

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
//
// A casca (barra do topo, botão, rodapé) vem de `layout.ts`, que é a MESMA dos
// outros e-mails da Somatec. Aqui mora só o miolo — o que este e-mail tem de
// diferente dos outros.
// =============================================================================

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
          <td style="padding:10px 0;border-bottom:1px solid #dce4ec;font-size:15px;color:${CORES.texto};">
            ${i.quantidade > 1 ? `${i.quantidade}&times; ` : ''}${escapar(i.descricao)}
            ${i.modelo ? `<br><span style="font-size:13px;color:${CORES.suave};">${escapar(i.modelo)}</span>` : ''}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #dce4ec;font-size:15px;color:${CORES.texto};text-align:right;white-space:nowrap;">
            ${formatarBRL(i.precoCentavos * (i.quantidade || 1))}
          </td>
        </tr>`,
    )
    .join('');

  const corpo = `  <tr><td style="padding:40px 44px 8px 44px;">
    <p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:${CORES.texto};">Olá, ${escapar(primeiroNome(d.nome))}!</p>
    <p style="margin:0 0 20px 0;font-size:20px;line-height:1.45;color:${CORES.navy};font-weight:600;">Recebemos o seu pedido.</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:${CORES.texto};">Guarde o número abaixo — é com ele que você acompanha a entrega.</p>
  </td></tr>

  <!-- O número é o motivo deste e-mail existir: vem grande e sozinho. -->
  <tr><td style="padding:20px 44px 8px 44px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #dce4ec;">
      <tr><td align="center" style="padding:22px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:${CORES.navy};text-transform:uppercase;">Número do pedido</div>
        <div style="margin-top:8px;font-size:26px;font-weight:700;letter-spacing:2px;color:${CORES.texto};">${d.numero}</div>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:18px 44px 8px 44px;">
    ${botao(linkDoPedido(d.numero), 'Acompanhar meu pedido')}
  </td></tr>

  <tr><td style="padding:22px 44px 8px 44px;">
    <div style="font-size:13px;font-weight:700;color:${CORES.navy};text-transform:uppercase;letter-spacing:.6px;">Resumo</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;">
      ${itens}
      <tr>
        <td style="padding:10px 0 0;font-size:14px;color:${CORES.suave};">Frete</td>
        <td style="padding:10px 0 0;font-size:14px;color:${CORES.texto};text-align:right;">${d.freteCentavos === 0 ? 'Grátis' : formatarBRL(d.freteCentavos)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:${CORES.texto};">Total</td>
        <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:${CORES.texto};text-align:right;">${formatarBRL(d.totalCentavos)}</td>
      </tr>
      ${d.formaPagamento ? `<tr><td style="padding:6px 0 0;font-size:14px;color:${CORES.suave};">Pagamento</td><td style="padding:6px 0 0;font-size:14px;color:${CORES.texto};text-align:right;">${escapar(d.formaPagamento)}</td></tr>` : ''}
    </table>
    ${d.cidade && d.uf ? `<p style="margin:14px 0 0;font-size:14px;color:${CORES.suave};">Entrega em ${escapar(d.cidade)}/${escapar(d.uf)}.</p>` : ''}
  </td></tr>

  <tr><td style="padding:18px 44px 44px 44px;">
    <p style="margin:0;font-size:14px;line-height:1.7;color:${CORES.suave};">
      Nossa equipe entra em contato para finalizar o pedido com você. Qualquer dúvida, é só
      <a href="${whatsappHref(`Olá! Tenho uma dúvida sobre o pedido ${d.numero}.`)}" style="color:${CORES.navy};text-decoration:underline;">chamar no WhatsApp</a>.
    </p>
  </td></tr>
`;

  return layoutEmail({
    titulo: assuntoPedido(d.numero),
    preheader: `Seu número de pedido é ${d.numero}. Guarde para acompanhar a entrega.`,
    corpo,
    motivo: 'Você recebeu este e-mail porque fez um pedido no nosso site.',
  });
}
