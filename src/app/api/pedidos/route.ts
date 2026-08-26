import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { criarPedido } from '@/lib/pedidos/servidor';
import { limitFormSubmit } from '@/lib/ratelimit/upstash';
import { rateLimitHeaders } from '@/lib/ratelimit/headers';
import { getClientIp } from '@/lib/http/client-ip';
import { apiVersionHeaders } from '@/lib/http/headers';
import { trackRequest } from '@/lib/metrics/registry';
import { createLogger } from '@/lib/logger';

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
  itens: z.array(itemSchema).max(30).default([]),
  totalCentavos: z.number().int().min(0).max(100_000_000),
  freteCentavos: z.number().int().min(0).max(10_000_000).default(0),
  formaPagamento: z.string().max(40).nullish(),
  endereco: z.record(z.string(), z.unknown()).default({}),
  setor: z.string().max(40).nullish(),
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
  trackRequest(ROUTE, 201);
  return NextResponse.json(
    { ok: true, numero: r.numero },
    { status: 201, headers: { ...apiVersionHeaders(), ...rateLimitHeaders(limite) } },
  );
}
