import { NextResponse, type NextRequest } from 'next/server';
import {
  EVENTOS_CANCELADO,
  EVENTOS_PAGO,
  consultarParcelamento,
  webhookAutentico,
} from '@/lib/pagamento/asaas';
import { registrarEventoPagamento } from '@/lib/pagamento/registro';
import { numeroValido } from '@/lib/pedidos/tipos';
import { trackRequest } from '@/lib/metrics/registry';
import { apiVersionHeaders } from '@/lib/http/headers';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/webhooks/asaas';
const log = createLogger('webhook-asaas');

/**
 * POST /api/webhooks/asaas — o gateway avisando que o dinheiro entrou.
 *
 * **Auth:** o token que NÓS cadastramos no painel do Asaas volta no cabeçalho
 * `asaas-access-token`. Sem token configurado no ambiente, recusa tudo: esta
 * URL é pública, e aceitar sem conferir deixaria qualquer um marcar pedido como
 * pago. Falhar fechado é a única postura quando a pergunta é "esse dinheiro
 * entrou mesmo?".
 *
 * **Sempre 200 depois de autenticado**, inclusive pra evento que a gente ignora:
 * o Asaas reentrega o que não recebeu 2xx, e ficar devolvendo erro pra um evento
 * que conscientemente descartamos vira fila infinita do lado dele.
 *
 * **Idempotência:** reentrega é normal (e o Asaas manda o mesmo evento mais de
 * uma vez em instabilidade). O registro casa por `id` do evento; repetido não
 * muda nada duas vezes.
 */
export async function POST(request: NextRequest) {
  if (!webhookAutentico(request.headers.get('asaas-access-token'))) {
    log.warn('webhook recusado — token invalido ou ausente');
    trackRequest(ROUTE, 401);
    return NextResponse.json(
      { ok: false, message: 'nao autorizado' },
      { status: 401, headers: apiVersionHeaders() },
    );
  }

  let corpo: {
    id?: string;
    event?: string;
    payment?: {
      id?: string;
      externalReference?: string;
      value?: number;
      status?: string;
      /** Id do PARCELAMENTO, quando a venda foi em Nx. */
      installment?: string | null;
    };
  };
  try {
    corpo = (await request.json()) as typeof corpo;
  } catch {
    // Corpo ilegível não é reentregável: 200 pra não pendurar a fila do Asaas.
    log.warn('webhook com corpo invalido');
    trackRequest(ROUTE, 200);
    return NextResponse.json({ ok: true, efeito: 'ignorado' }, { headers: apiVersionHeaders() });
  }

  const evento = corpo.event ?? '';
  const pedido = corpo.payment?.externalReference ?? null;
  const situacao = EVENTOS_PAGO.has(evento)
    ? 'pago'
    : EVENTOS_CANCELADO.has(evento)
      ? 'nao_pago'
      : null;

  if (!situacao || !pedido) {
    // Eventos que não mexem no pedido (cobrança criada, atualizada, e-mail
    // enviado…) são a maioria do volume. Não são erro.
    log.info('evento sem efeito no pedido', { evento, pedido });
    trackRequest(ROUTE, 200);
    return NextResponse.json(
      { ok: true, efeito: 'ignorado', evento },
      { headers: apiVersionHeaders() },
    );
  }

  // `externalReference` que não tem a forma de pedido nosso: cobrança criada
  // fora do checkout, integração de terceiro, ou disparo de teste. Não existe
  // pedido pra mexer nem comprador pra avisar.
  //
  // Por que a porta é AQUI e não lá na frente: deixando seguir, o evento chega
  // em `avisarCliente`, não acha contato e registra `log.error` — que vai pro
  // Sentry. Só que aquele erro existe pra um caso grave e específico: pedido de
  // VERDADE, número válido, e ainda assim sem contato (linha sumiu da tabela,
  // ou a chave perdeu poder de leitura) — alguém pagou e ficou no silêncio. Foi
  // isso que a SOMATEC-WEB-4 fez em 09/09: 5 alarmes desses pra um número de
  // teste. Alarme que dispara à toa para de ser alarme.
  //
  // `warn`, não `error`: só `error` sobe pro Sentry, e evento perdido do
  // gateway se procura no log do Railway. E continua 200 — o Asaas reentrega o
  // que não recebe 2xx, e isso aqui não vai melhorar na segunda tentativa.
  if (!numeroValido(pedido)) {
    log.warn('externalReference nao e numero de pedido do site — evento ignorado', {
      evento,
      pedido,
    });
    trackRequest(ROUTE, 200);
    return NextResponse.json(
      { ok: true, efeito: 'ignorado', evento },
      { headers: apiVersionHeaders() },
    );
  }

  // Venda parcelada: o evento chega POR PARCELA, com o valor da parcela. O
  // total e o número de parcelas só existem no parcelamento — sem consultar,
  // o aviso informaria menos dinheiro do que entrou.
  const idParcelamento = corpo.payment?.installment ?? null;
  const parcelamento = idParcelamento
    ? await consultarParcelamento(idParcelamento).then((p) => (p ? { id: idParcelamento, ...p } : null))
    : null;

  const efeito = await registrarEventoPagamento({
    eventoId: corpo.id ?? `${evento}:${corpo.payment?.id ?? ''}`,
    evento,
    numeroPedido: pedido,
    cobrancaId: corpo.payment?.id ?? null,
    situacao,
    valorCentavos: Math.round((corpo.payment?.value ?? 0) * 100),
    parcelamento,
  });

  log.info('pagamento registrado', { evento, pedido, efeito });
  trackRequest(ROUTE, 200);
  return NextResponse.json({ ok: true, efeito }, { headers: apiVersionHeaders() });
}
