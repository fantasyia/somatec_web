import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { criarPedido } from '@/lib/pedidos/servidor';
import { limitFormSubmit } from '@/lib/ratelimit/upstash';
import { rateLimitHeaders } from '@/lib/ratelimit/headers';
import { getClientIp } from '@/lib/http/client-ip';
import { apiVersionHeaders } from '@/lib/http/headers';
import { trackRequest } from '@/lib/metrics/registry';
import { createLogger } from '@/lib/logger';
import { enviarEmail } from '@/lib/email/enviar';
import { montarPedidoBetinna, enviarPedidoBetinna } from '@/lib/betinna/pedidos';
import { enqueueSubmission, markAttempt, markSent } from '@/lib/webhook-queue';
import { assuntoPedido, htmlPedido, textoPedido } from '@/lib/email/pedido-confirmado';
import { buildMullerBotPayload } from '@/lib/mullerbot/payload';
import { getLgpdConsentText } from '@/lib/lgpd';
import { entregarLead } from '@/lib/leads/entregar';
import type { FormSubmitData } from '@/lib/forms/schemas';

const log = createLogger('api-pedidos');
const ROUTE = '/api/pedidos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================================================
// Registra o pedido e devolve o NÚMERO.
//
// Separada do `/api/forms/submit` de propósito: aquele manda lead pro CRM e
// pode falhar sem que o cliente perca nada. Este aqui gera a identidade do
// pedido — se falhar, o cliente fica sem como acompanhar, então o checkout
// precisa saber a diferença.
// =============================================================================

const itemSchema = z.object({
  descricao: z.string().min(1).max(200),
  modelo: z.string().max(60).nullish(),
  quantidade: z.number().int().min(1).max(99).default(1),
  precoCentavos: z.number().int().min(0).max(100_000_000),
});

const schema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(160),
  whatsapp: z.string().max(40).nullish(),
  empresa: z.string().max(160).nullish(),
  /** CPF/CNPJ do comprador. Sem ele o ERP não emite nota — e sem nota não sai
   *  etiqueta. O checkout valida dígito verificador antes de mandar. */
  documento: z.string().max(20).nullish(),
  itens: z.array(itemSchema).max(30).default([]),
  totalCentavos: z.number().int().min(0).max(100_000_000),
  freteCentavos: z.number().int().min(0).max(10_000_000).default(0),
  formaPagamento: z.string().max(40).nullish(),
  endereco: z.record(z.string(), z.unknown()).default({}),
  setor: z.string().max(40).nullish(),
  /** Resumo legível do que a pessoa montou no wizard. Vem do CLIENTE porque é
   *  ele que tem o estado do passo a passo; o servidor só o repassa ao CRM. */
  resumo: z.string().max(2000).nullish(),
  /** Consentimento LGPD do passo 5. Sem `true` o lead NÃO é entregue — mesma
   *  regra do /api/forms/submit, que recusa consentimento ausente. */
  lgpdConsent: z.boolean().nullish(),
  origem: z.string().max(80).nullish(),
  // Armadilha de robô: campo escondido que gente não preenche.
  website: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  const limite = await limitFormSubmit(ip);
  if (!limite.allowed) {
    trackRequest(ROUTE, 429);
    return NextResponse.json(
      { ok: false, message: 'Muitas tentativas. Aguarde um instante.' },
      { status: 429, headers: { ...apiVersionHeaders(), ...rateLimitHeaders(limite) } },
    );
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    trackRequest(ROUTE, 400);
    return NextResponse.json({ ok: false, message: 'Corpo inválido.' }, { status: 400 });
  }

  const parsed = schema.safeParse(corpo);
  if (!parsed.success) {
    trackRequest(ROUTE, 400);
    return NextResponse.json(
      { ok: false, message: 'Dados do pedido incompletos.' },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  // Honeypot preenchido = robô. Responde 200 sem gravar nada: dizer "recusado"
  // ensina o robô a contornar.
  if (parsed.data.website) {
    trackRequest(ROUTE, 200);
    return NextResponse.json({ ok: true, numero: null }, { headers: apiVersionHeaders() });
  }

  const { website: _ignorado, ...dados } = parsed.data;
  const r = await criarPedido(dados);

  if (!r.ok) {
    // Freio do banco (10 pedidos por e-mail por hora) é 429, não 500: o
    // servidor está bem, quem passou do limite foi a chamada.
    if (r.excedeuLimite) {
      trackRequest(ROUTE, 429);
      return NextResponse.json(
        {
          ok: false,
          message:
            'Já registramos vários pedidos com este e-mail na última hora. Se precisar de outro, fale com a gente no WhatsApp.',
        },
        { status: 429, headers: apiVersionHeaders() },
      );
    }
    log.error('pedido nao registrado', { erro: r.erro });
    trackRequest(ROUTE, 500);
    return NextResponse.json(
      { ok: false, message: 'Não conseguimos registrar o pedido agora.' },
      { status: 500, headers: apiVersionHeaders() },
    );
  }

  log.info('pedido registrado', { numero: r.numero });

  // ── O pedido sobe pro Betinna, e de lá pro ERP ─────────────────────────
  //
  // Enfileira ANTES de tentar: se o Betinna estiver fora do ar, o cron entrega
  // depois. Pedido que o cliente pagou e não chega ao ERP é pedido que ninguém
  // separa — e aqui, diferente do lead, não existe segunda via.
  //
  // Nada disso pode transformar um pedido bom em erro na tela: o pedido já
  // existe e o número já está na resposta. Falha aqui é log, não 500.
  await enviarAoBetinna(dados, r.numero);

  // Confirmação por e-mail. É AVISO, não é a transação: o pedido já existe e
  // o número já vai na resposta. Por isso o envio é aguardado mas o resultado
  // é ignorado — falhar aqui não pode transformar um pedido bom em erro na
  // tela do cliente.
  //
  // Aguardado, e não disparado solto, porque em serverless a função pode ser
  // congelada assim que a resposta sai: "fire and forget" viraria "forget".
  const endereco = dados.endereco as { cidade?: string; uf?: string };
  await enviarEmail({
    para: dados.email,
    assunto: assuntoPedido(r.numero),
    html: htmlPedido({ ...dados, numero: r.numero, cidade: endereco?.cidade, uf: endereco?.uf }),
    texto: textoPedido({ ...dados, numero: r.numero }),
    marcador: `pedido:${r.numero}`,
  });

  // ── O LEAD do pedido, entregue AQUI e não pelo navegador ──────────────
  //
  // Antes o checkout fazia uma SEGUNDA chamada, do browser, depois deste 201.
  // Se ela falhasse — captcha, rede, aba fechada, limite de taxa — o pedido
  // existia e o lead não, e nada acusava: o cliente via "pedido confirmado" e
  // o CRM não sabia de nada. Aconteceu de verdade em 02/09.
  //
  // Aqui o lead entra na MESMA fila do pedido, então falha vira retentativa do
  // cron em vez de sumiço. E não depende de captcha: quem chegou até criar um
  // pedido já passou pelo limite de taxa e pelo honeypot desta rota, e pedido
  // criado é sinal de humano bem mais forte que qualquer desafio.
  const leadEnviado = await entregarLeadDoPedido(dados, r.numero, ip);

  trackRequest(ROUTE, 201);
  return NextResponse.json(
    // `leadEnviado` diz ao checkout que ele NÃO precisa mandar o lead de novo.
    // Sem isso, os dois mandariam e o CRM receberia em duplicidade.
    { ok: true, numero: r.numero, leadEnviado },
    { status: 201, headers: { ...apiVersionHeaders(), ...rateLimitHeaders(limite) } },
  );
}

/**
 * Monta e entrega o lead do pedido concluído.
 *
 * Devolve `false` quando não havia lead a entregar (sem consentimento) ou
 * quando nem a fila aceitou — nos dois casos o checkout ainda tenta pelo
 * caminho antigo, que é melhor que ficar sem lead nenhum.
 */
async function entregarLeadDoPedido(
  dados: Omit<z.infer<typeof schema>, 'website'>,
  numero: string,
  ip: string,
): Promise<boolean> {
  // Sem consentimento não há lead. Mesma regra do /api/forms/submit, que
  // recusa `lgpd_consent` ausente — o pedido é registrado do mesmo jeito, mas
  // o dado não vai pro CRM.
  if (dados.lgpdConsent !== true) {
    log.warn('pedido sem consentimento LGPD — lead nao entregue', { numero });
    return false;
  }

  const setor = (dados.setor ?? '').toLowerCase();
  // A LP já define o público; perguntar de novo seria pedir o que já se sabe.
  const publico = setor === 'residencial' ? 'residencia' : 'comercio';
  // `origem` chega como "site:protecao-residencial" — a página é o que vem
  // depois dos dois-pontos.
  const pagina = (dados.origem ?? '').split(':')[1] ?? '';

  try {
    const lgpd = await getLgpdConsentText();
    const payload = buildMullerBotPayload({
      validated: {
        form_type: 'b2b',
        interest_type: 'b2b',
        name: dados.nome,
        email: dados.email,
        whatsapp: dados.whatsapp ?? '',
        company: dados.empresa ?? '',
        message: dados.resumo ? `[Pedido ${numero}] ${dados.resumo}` : `[Pedido ${numero}]`,
        lgpd_consent: true,
        source_page: pagina ? `/${pagina}` : '/',
        website: '',
        captcha_token: '',
        formulario: 'checkout-ni-pedido',
        publico,
        setor: dados.setor ?? '',
        segment: `NI · ${dados.setor ?? ''}`,
      } as unknown as FormSubmitData,
      ip,
      userAgent: 'api/pedidos',
      referer: null,
      lgpdTextVersion: lgpd.version,
      lgpdTextRaw: lgpd.text,
    });

    const r = await entregarLead(payload, { sourcePage: pagina ? `/${pagina}` : null, sourceIp: ip });
    log.info('lead do pedido', { numero, resultado: r });
    // `na_fila` também conta como entregue pro checkout: a fila garante a
    // entrega, e mandar de novo do navegador só duplicaria.
    return r !== 'nao_enfileirado';
  } catch (err) {
    log.error('falha montando o lead do pedido', { numero }, err);
    return false;
  }
}

/**
 * Entrega o pedido no Betinna com rede de proteção.
 *
 * `idempotencyKey` é o número do pedido: a fila tem UNIQUE nessa coluna, então
 * reenvio do mesmo pedido não vira segunda linha — e o endpoint do Betinna é
 * idempotente pelo mesmo número. Duas travas pro mesmo risco, que é o pior de
 * todos aqui: pedido em dobro no ERP vira nota em dobro.
 */
async function enviarAoBetinna(
  dados: Omit<z.infer<typeof schema>, 'website'>,
  numero: string,
): Promise<void> {
  const pedido = montarPedidoBetinna({ ...dados, numero });
  if (!pedido) {
    // Só quadro a dimensionar: é orçamento, não venda fechada. Vira lead pelo
    // caminho normal; subir pro ERP criaria pedido sem o que faturar.
    log.info('pedido sem item faturável — nao subiu ao ERP', { numero });
    return;
  }

  const chave = `pedido:${numero}`;
  try {
    await enqueueSubmission({
      idempotencyKey: chave,
      payload: pedido,
      destination: 'betinna-pedido',
      sourcePage: dados.origem ?? null,
      sourceIp: null,
    });
  } catch (err) {
    // Sem fila não há segunda chance, mas ainda vale tentar o envio direto.
    log.error('nao consegui enfileirar o pedido', {
      numero,
      erro: err instanceof Error ? err.message : String(err),
    });
  }

  const outcome = await enviarPedidoBetinna(pedido);
  if (outcome.result === 'sent') {
    await markSent(chave, outcome.status, outcome.externalId ?? null);
    log.info('pedido no ERP', { numero, erp: outcome.externalId });
    return;
  }
  await markAttempt(chave, outcome, 0);
  log.warn('pedido nao subiu agora — fila reentrega', { numero, outcome: outcome.result });
}
