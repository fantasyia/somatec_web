import 'server-only';

import { CONTACT, SITE, whatsappHref } from '@/lib/constants/site';
import { escapar } from '@/lib/email/html';
import { CORES, botao, layoutEmail } from '@/lib/email/layout';
import { formatarBRL } from '@/lib/pedidos/tipos';

// =============================================================================
// E-mail de PAGAMENTO CONFIRMADO — o segundo tempo, e só quando ele existe.
//
// O cliente já recebeu um e-mail nosso no checkout (`pedido-confirmado.ts`),
// com marca, número e link de acompanhamento. Este aqui tem outra função: dizer
// que o DINHEIRO ENTROU.
//
// Por isso ele não sai sempre. No cartão a confirmação chega segundos depois do
// e-mail de pedido — dois e-mails quase idênticos em um minuto ensinam a pessoa
// a ignorar o remetente exatamente antes da fase em que ela PRECISA abrir, que
// é a do rastreio. No PIX o intervalo é real: sai da página, paga meia hora
// depois, e hoje não recebe sinal nenhum de que caiu. É esse caso que este
// e-mail atende — ver `deveAvisarPagamento`.
//
// É o mesmo critério já aplicado no aviso de rastreio, que só sai no despacho
// real e não na compra da etiqueta: não gastar a atenção do cliente antes da
// hora em que ela importa.
//
// ⚠️ NÃO PROMETER ENVIO. Pagamento confirmado não é produto despachado — neste
// momento o pedido ainda está "recebido", e separação, nota e etiqueta vêm
// depois. Qualquer frase do tipo "seu pedido está a caminho" vira reclamação
// dois dias depois.
//
// Deliberadamente mais curto que o e-mail de pedido: sem lista de itens. Os
// itens já foram no anterior; repeti-los faria deste um segundo comprovante, e
// aí a pessoa precisa comparar dois e-mails pra saber qual vale.
// =============================================================================

/**
 * Abaixo deste intervalo entre o pedido e a confirmação, o e-mail de pedido
 * acabou de cumprir o papel e este não sai.
 *
 * 10 minutos separa bem os dois mundos reais: cartão aprova em segundos; PIX
 * que passa disso é gente que saiu da página, foi no app do banco e voltou —
 * ou nem voltou.
 */
export const JANELA_SILENCIO_MS = 10 * 60 * 1000;

export type DadosEmailPagamento = {
  numero: string;
  primeiroNome?: string | null;
  /** O que o gateway reportou para ESTA cobrança. */
  valorCentavos: number;
  formaPagamento?: string | null;
};

/**
 * A regra do intervalo, num lugar só — quem dispara e quem testa leem a mesma.
 *
 * `criadoEm` desconhecido devolve `true` de propósito: significa que a consulta
 * do pedido falhou, o que é anomalia. Entre mandar um e-mail a mais e deixar
 * alguém que acabou de pagar R$ 4.350 sem resposta, o silêncio é o pior dos
 * dois — e é o único dos dois que gera mensagem no WhatsApp perguntando se o
 * dinheiro chegou.
 */
export function deveAvisarPagamento(args: {
  criadoEm: string | Date | null | undefined;
  confirmadoEm?: Date;
}): boolean {
  if (!args.criadoEm) return true;
  const criado = args.criadoEm instanceof Date ? args.criadoEm : new Date(args.criadoEm);
  const t = criado.getTime();
  if (!Number.isFinite(t)) return true;
  return (args.confirmadoEm ?? new Date()).getTime() - t >= JANELA_SILENCIO_MS;
}

function primeiro(nome?: string | null): string {
  return String(nome || '')
    .trim()
    .split(/\s+/)[0] || '';
}

function linkDoPedido(numero: string): string {
  return `${SITE.url}/pedido/${numero}`;
}

export function assuntoPagamento(numero: string): string {
  // O número no assunto mantém os e-mails do mesmo pedido juntos na busca da
  // caixa de entrada, como no e-mail de pedido.
  return `Pagamento confirmado — pedido ${numero}`;
}

export function textoPagamento(d: DadosEmailPagamento): string {
  const ola = primeiro(d.primeiroNome);
  return [
    ola ? `Olá, ${ola}!` : 'Olá!',
    '',
    `Confirmamos o pagamento de ${formatarBRL(d.valorCentavos)}${
      d.formaPagamento ? ` (${d.formaPagamento})` : ''
    } do pedido ${d.numero}.`,
    '',
    'Agora preparamos o seu pedido. Assim que ele sair para entrega, você recebe',
    'o código de rastreio por aqui — não precisa fazer nada até lá.',
    '',
    `Acompanhe em: ${linkDoPedido(d.numero)}`,
    '',
    `Dúvidas? Chame no WhatsApp: ${CONTACT.whatsappDisplay}`,
    '',
    'Somatec Blocking',
  ].join('\n');
}

export function htmlPagamento(d: DadosEmailPagamento): string {
  const ola = primeiro(d.primeiroNome);
  const valor = formatarBRL(d.valorCentavos);

  const corpo = `  <tr><td style="padding:40px 44px 8px 44px;">
    <p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:${CORES.texto};">${ola ? `Olá, ${escapar(ola)}!` : 'Olá!'}</p>
    <p style="margin:0 0 20px 0;font-size:20px;line-height:1.45;color:${CORES.navy};font-weight:600;">Seu pagamento foi confirmado.</p>
  </td></tr>

  <!-- O valor é o motivo deste e-mail existir: vem sozinho e em destaque. -->
  <tr><td style="padding:0 44px 8px 44px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #dce4ec;">
      <tr><td align="center" style="padding:22px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:${CORES.navy};text-transform:uppercase;">Pagamento confirmado</div>
        <div style="margin-top:8px;font-size:26px;font-weight:700;color:${CORES.texto};">${valor}</div>
        ${d.formaPagamento ? `<div style="margin-top:4px;font-size:13px;color:${CORES.suave};">${escapar(d.formaPagamento)}</div>` : ''}
        <div style="margin-top:12px;font-size:13px;color:${CORES.suave};">Pedido <strong style="color:${CORES.texto};letter-spacing:1px;">${d.numero}</strong></div>
      </td></tr>
    </table>
  </td></tr>

  <!-- O que vem a seguir, SEM prometer despacho: neste momento o pedido ainda
       está "recebido". -->
  <tr><td style="padding:18px 44px 0 44px;">
    <p style="margin:0;font-size:15px;line-height:1.7;color:${CORES.texto};">
      Agora preparamos o seu pedido. <strong>Assim que ele sair para entrega, você recebe o código de rastreio por aqui</strong> — não precisa fazer nada até lá.
    </p>
  </td></tr>

  <tr><td style="padding:24px 44px 8px 44px;">
    ${botao(linkDoPedido(d.numero), 'Acompanhar meu pedido')}
  </td></tr>

  <tr><td style="padding:8px 44px 44px 44px;">
    <p style="margin:0;font-size:14px;line-height:1.7;color:${CORES.suave};">
      Qualquer dúvida, é só <a href="${whatsappHref(`Olá! Tenho uma dúvida sobre o pedido ${d.numero}.`)}" style="color:${CORES.navy};text-decoration:underline;">chamar no WhatsApp</a>.
    </p>
  </td></tr>
`;

  return layoutEmail({
    titulo: assuntoPagamento(d.numero),
    preheader: `Recebemos ${valor} do pedido ${d.numero}. Agora preparamos o seu pedido.`,
    corpo,
    motivo: 'Você recebeu este e-mail porque o pagamento do seu pedido foi confirmado.',
  });
}
