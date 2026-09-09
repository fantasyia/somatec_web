import 'server-only';

import { SITE } from '@/lib/constants/site';
import { escapar } from '@/lib/email/html';
import { CORES, botao, layoutEmail } from '@/lib/email/layout';

// =============================================================================
// AVISO INTERNO de pagamento — pra quem separa e fatura.
//
// É o elo humano enquanto "pago" não é um estado do pedido: sem ele, o dinheiro
// entra e ninguém do outro lado sabe.
//
// Vai pra dentro de casa, e isso muda duas coisas em relação aos e-mails de
// cliente:
//
//   • SEM a identificação legal no rodapé. Razão social, CNPJ e endereço estão
//     lá pra identificar o fornecedor ao CONSUMIDOR (Decreto 7.962/2013). Aqui
//     só empurrariam pra baixo o que a pessoa precisa ler.
//   • O texto é INSTRUÇÃO, não cortesia. Quem abre precisa saber, em um olhar,
//     se pode seguir com a separação — e ter os dados do gateway à mão pra
//     conferir na conta quando não bater.
//
// A casca (barra, botão, cores, fonte) é a MESMA dos e-mails de cliente, pelos
// mesmos motivos técnicos — ver `layout.ts`. Aviso interno que chega quebrado
// no Outlook é tão inútil quanto e-mail de cliente quebrado.
// =============================================================================

export type DadosAvisoInterno = {
  numeroPedido: string;
  /** Nome do evento do gateway, como veio. Serve pra rastrear na conta. */
  evento: string;
  cobrancaId: string | null;
  pago: boolean;
  /** O valor do evento. Na venda parcelada, é o valor da PARCELA. */
  valorCentavos: number;
  parcelamento?: { totalCentavos: number; parcelas: number } | null;
};

function emReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** O TOTAL da venda — é o número que importa pra quem separa e fatura. */
function total(d: DadosAvisoInterno): string {
  return emReais(d.parcelamento?.totalCentavos ?? d.valorCentavos);
}

export function assuntoInterno(d: DadosAvisoInterno): string {
  return d.pago
    ? `Pagamento confirmado — pedido ${d.numeroPedido} (${total(d)})`
    : `Pagamento NÃO concluído — pedido ${d.numeroPedido}`;
}

function linhas(d: DadosAvisoInterno): Array<[string, string]> {
  const l: Array<[string, string]> = [['Pedido', d.numeroPedido]];
  l.push(['Valor', total(d)]);
  if (d.parcelamento) {
    // O parcelamento muda QUANDO o dinheiro entra na conta — quem concilia
    // precisa disso, e quem separa precisa saber que já pode seguir mesmo assim.
    l.push([
      'Parcelamento',
      `${d.parcelamento.parcelas}x de ${emReais(d.valorCentavos)}`,
    ]);
  }
  l.push(['Evento', d.evento]);
  if (d.cobrancaId) l.push(['Cobrança', d.cobrancaId]);
  return l;
}

export function textoInterno(d: DadosAvisoInterno): string {
  return [
    d.pago
      ? `Pagamento confirmado. Pode seguir com a separação e o faturamento.`
      : `Pagamento não concluído. Vale confirmar com o cliente antes de separar.`,
    '',
    ...linhas(d).map(([r, v]) => `${r}: ${v}`),
    '',
    `Pedido: ${SITE.url}/pedido/${d.numeroPedido}`,
    '',
    'Aviso automático do site.',
  ].join('\n');
}

export function htmlInterno(d: DadosAvisoInterno): string {
  const tabela = linhas(d)
    .map(
      ([rotulo, valor]) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #dce4ec;font-size:13px;color:${CORES.suave};white-space:nowrap;">${escapar(rotulo)}</td>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #dce4ec;font-size:14px;color:${CORES.texto};text-align:right;font-weight:600;">${escapar(valor)}</td>
        </tr>`,
    )
    .join('');

  const corpo = `  <tr><td style="padding:40px 44px 8px 44px;">
    <p style="margin:0 0 20px 0;font-size:20px;line-height:1.45;color:${CORES.navy};font-weight:600;">${
      d.pago ? 'Pagamento confirmado.' : 'Pagamento não concluído.'
    }</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:${CORES.texto};">${
      d.pago
        ? 'Pode seguir com a <strong>separação</strong> e o <strong>faturamento</strong>.'
        : 'Vale <strong>confirmar com o cliente</strong> antes de separar.'
    }</p>
  </td></tr>

  <tr><td style="padding:20px 44px 8px 44px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${tabela}
    </table>
  </td></tr>

  <tr><td style="padding:24px 44px 44px 44px;">
    ${botao(`${SITE.url}/pedido/${d.numeroPedido}`, 'Abrir o pedido')}
  </td></tr>
`;

  return layoutEmail({
    titulo: assuntoInterno(d),
    preheader: d.pago
      ? `${total(d)} no pedido ${d.numeroPedido}. Pode separar e faturar.`
      : `Pedido ${d.numeroPedido} sem pagamento confirmado (${d.evento}).`,
    corpo,
    motivo: 'Aviso automático do site, disparado pelo gateway de pagamento.',
    identificacao: false,
  });
}
