import { NextResponse, type NextRequest } from 'next/server';
import { CONTACT } from '@/lib/constants/site';
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
import { asaasConfigurado, criarCobranca } from '@/lib/pagamento/asaas';
import { FORMA_NO_GATEWAY, type FormaPagamentoId } from '@/lib/constants/pagamento';
import { precificarPedido } from '@/lib/pedidos/precificar';
import { enviarEventoMeta, montarFbc } from '@/lib/meta/capi';
import { randomUUID } from 'node:crypto';
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

/**
 * Tira o `fbclid` do cookie de atribuição (`stc_attrib`, first-party, escrito
 * na chegada). É ele que vira `fbc` e liga a conversão ao clique no anúncio —
 * o sinal de match mais forte que a gente tem, e já estava guardado.
 */
function fbclidDaRequisicao(req: NextRequest): string | null {
  const bruto = req.cookies.get('stc_attrib')?.value;
  if (!bruto) return null;
  try {
    const attr = JSON.parse(decodeURIComponent(bruto)) as {
      primeiro?: { fbclid?: string };
      ultimo?: { fbclid?: string };
    };
    return attr.ultimo?.fbclid ?? attr.primeiro?.fbclid ?? null;
  } catch {
    return null;
  }
}

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
  /** Mesmo id do evento do navegador — dedupe do CAPI. */
  event_id: z.string().max(64).optional(),
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

  const { website: _ignorado, ...recebido } = parsed.data;

  // ── PREÇO É DO SERVIDOR ────────────────────────────────────────────────
  //
  // O corpo traz `precoCentavos` e `totalCentavos`, e o schema valida forma e
  // teto — mas não a ORIGEM: o número vem do navegador. Enquanto não havia
  // pagamento online isso só sujava o registro; com o gateway ligado, é ele que
  // define quanto o cliente PAGA. Um POST com `totalCentavos: 100` gerava
  // cobrança de R$ 1,00 por um equipamento de R$ 4.350,00.
  //
  // A partir daqui o corpo vale como INTENÇÃO (qual modelo, quantas unidades);
  // preço e frete saem do catálogo.
  const preco = precificarPedido(recebido.itens, {
    totalCentavos: recebido.totalCentavos,
    freteCentavos: recebido.freteCentavos,
  });
  if (!preco.ok) {
    log.warn('pedido recusado na precificacao', { motivo: preco.motivo, detalhe: preco.detalhe });
    trackRequest(ROUTE, 422);
    return NextResponse.json(
      {
        ok: false,
        message:
          'Não conseguimos confirmar o preço deste pedido. Recarregue a página e monte o pedido de novo.',
      },
      { status: 422, headers: apiVersionHeaders() },
    );
  }
  if (preco.divergenciaCentavos !== 0) {
    // Barulho ALTO e recusa. Divergência é uma de duas coisas: adulteração, ou
    // página velha com preço antigo. Cobrar o valor novo sem a pessoa ver seria
    // cobrar mais do que foi anunciado; cobrar o antigo é aceitar o número do
    // cliente, que é a brecha. As duas se resolvem com a página recarregada.
    log.error('DIVERGENCIA DE PRECO no pedido', {
      email: recebido.email,
      afirmadoCentavos: recebido.totalCentavos,
      realCentavos: preco.totalCentavos,
      difCentavos: preco.divergenciaCentavos,
      itens: recebido.itens.map((i) => `${i.modelo ?? '?'}x${i.quantidade ?? 1}`),
    });
    trackRequest(ROUTE, 409);
    return NextResponse.json(
      {
        ok: false,
        message:
          'O valor do pedido mudou desde que você abriu a página. Recarregue e confira o total antes de confirmar.',
      },
      { status: 409, headers: apiVersionHeaders() },
    );
  }

  // Daqui pra baixo, os números do SERVIDOR — inclusive no que é gravado.
  const dados = {
    ...recebido,
    itens: preco.itens,
    totalCentavos: preco.totalCentavos,
    freteCentavos: preco.freteCentavos,
  };
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
  // CAPI da Meta — o MESMO evento que o navegador empurrou, pelo servidor.
  // Sobrevive a bloqueador de anúncio e a iOS; o `event_id` igual nos dois
  // caminhos é o que impede a conversão de ser contada duas vezes.
  //
  // ⛔ `pedido_registrado`, NUNCA `Purchase`: enquanto o gateway não confirma
  // pagamento, marcar como compra ensinaria a Meta a caçar quem registra
  // pedido e não paga. Purchase nasce na confirmação do Asaas, não aqui.
  await enviarEventoMeta({
    nome: 'pedido_registrado',
    eventId: recebido.event_id ?? randomUUID(),
    urlOrigem: req.headers.get('referer'),
    usuario: {
      email: dados.email,
      telefone: dados.whatsapp,
      fbc: montarFbc(fbclidDaRequisicao(req)),
      fbp: req.cookies.get('_fbp')?.value ?? null,
      ip: getClientIp(req.headers),
      userAgent: req.headers.get('user-agent'),
    },
    dados: {
      currency: 'BRL',
      value: (dados.totalCentavos ?? 0) / 100,
      order_id: r.numero,
    },
  });

  const endereco = dados.endereco as { cidade?: string; uf?: string };
  await enviarEmail({
    para: dados.email,
    assunto: assuntoPedido(r.numero),
    html: htmlPedido({ ...dados, numero: r.numero, cidade: endereco?.cidade, uf: endereco?.uf }),
    texto: textoPedido({ ...dados, numero: r.numero }),
    // Remetente é pedidos@ (EMAIL_REMETENTE, transacional). Quem responde o
    // e-mail tem que cair no canal que alguém lê: comercial@ (Léo, 07/09 —
    // "é o e-mail que vai direto pro Leandro"). Sem isto, o "Responder" do
    // cliente ia pra caixa pedidos@.
    responderPara: CONTACT.email,
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

  // ── COBRANÇA ──────────────────────────────────────────────────────────
  //
  // Depois de tudo o que não pode falhar. O pedido JÁ existe e o número já
  // está garantido: se o gateway estiver fora, o cliente recebe o pedido
  // confirmado e a equipe cobra do jeito antigo — melhor que perder a venda
  // inteira porque um provedor externo piscou.
  //
  // Criada no SERVIDOR de propósito: a chave do Asaas nunca chega ao navegador.
  //
  // ⚠️ O VALOR ainda é o que o checkout mandou (validado por schema, mas de
  // origem do cliente) — é o mesmo número que já gravava o pedido antes do
  // gateway existir. Fechar isso é recalcular o total a partir do catálogo no
  // servidor, e é trabalho à parte: não inventei aqui pra não dar a impressão
  // de que já está protegido.
  const pagamentoUrl = await criarCobrancaDoPedido(dados, r.numero);

  trackRequest(ROUTE, 201);
  return NextResponse.json(
    // `leadEnviado` diz ao checkout que ele NÃO precisa mandar o lead de novo.
    // Sem isso, os dois mandariam e o CRM receberia em duplicidade.
    // `pagamentoUrl` ausente = checkout mostra o caminho de sempre (equipe
    // finaliza). Presente = o navegador redireciona pra página de pagamento.
    { ok: true, numero: r.numero, leadEnviado, pagamentoUrl },
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

/**
 * Cria a cobrança no gateway e devolve a página de pagamento.
 *
 * NUNCA lança: cobrança é o último passo, e o pedido já existe. Falha aqui vira
 * log + pedido sem link — que é exatamente o comportamento de antes do gateway,
 * e o cliente segue com o número dele.
 */
async function criarCobrancaDoPedido(
  dados: {
    nome: string;
    email: string;
    whatsapp?: string | null;
    documento?: string | null;
    formaPagamento?: string | null;
    endereco?: unknown;
    totalCentavos: number;
    freteCentavos: number;
  },
  numero: string,
): Promise<string | null> {
  if (!asaasConfigurado()) return null;
  const doc = (dados.documento ?? '').replace(/\D/g, '');
  if (!doc) {
    // O Asaas exige CPF/CNPJ pra criar cliente. O checkout já valida dígito,
    // então cair aqui é sinal de chamada fora da tela — não de cliente ruim.
    log.warn('pedido sem documento — cobranca nao criada', { numero });
    return null;
  }
  try {
    // Total + frete: é o que o cliente viu na tela e o que o pedido gravou.
    const total = Math.round(dados.totalCentavos) + Math.round(dados.freteCentavos ?? 0);
    if (total <= 0) {
      log.warn('pedido sem valor faturavel — cobranca nao criada', { numero });
      return null;
    }
    const escolhida = (dados.formaPagamento ?? '').toLowerCase().includes('cart') ? 'cartao' : 'pix';
    const cobranca = await criarCobranca({
      numeroPedido: numero,
      valorCentavos: total,
      forma: FORMA_NO_GATEWAY[escolhida as FormaPagamentoId],
      cliente: {
        nome: dados.nome,
        email: dados.email,
        cpfCnpj: doc,
        telefone: dados.whatsapp ?? null,
        cep: (dados.endereco as { cep?: string } | null)?.cep ?? null,
      },
    });
    return cobranca.url;
  } catch (err) {
    log.error('cobranca nao criada', { numero }, err);
    return null;
  }
}
