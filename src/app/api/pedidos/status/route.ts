import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { atualizarStatus } from '@/lib/pedidos/servidor';
import { STATUS_PEDIDO } from '@/lib/pedidos/tipos';
import { apiVersionHeaders } from '@/lib/http/headers';
import { trackRequest } from '@/lib/metrics/registry';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-pedidos-status');
const ROUTE = '/api/pedidos/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================================================
// Move o pedido: em separação, enviado (com rastreio), entregue, cancelado.
//
// Não existe tela pra isso — o /admin do site saiu em 25/08. Esta rota É o
// caminho: chamada pelo operador (hoje, pelo Claude a pedido do Léo; amanhã,
// pela integração de frete quando a etiqueta for emitida).
//
// ⛔ Protegida por segredo, e o segredo é conferido DUAS vezes: aqui, pra
// recusar cedo, e dentro da função do banco, que compara com o hash guardado.
// A checagem daqui sozinha não bastaria — a chave do Supabase é pública.
// =============================================================================

const schema = z.object({
  numero: z.string().min(6).max(40),
  status: z.enum(STATUS_PEDIDO),
  nota: z.string().max(300).nullish(),
  transportadora: z.string().max(80).nullish(),
  rastreioCodigo: z.string().max(80).nullish(),
  rastreioUrl: z.string().url().max(500).nullish(),
});

function autorizado(req: NextRequest): boolean {
  const esperado = process.env.PEDIDOS_STATUS_SECRET;
  if (!esperado) return false;
  return (req.headers.get('x-pedidos-secret') || '') === esperado;
}

export async function POST(req: NextRequest) {
  if (!process.env.PEDIDOS_STATUS_SECRET) {
    log.error('PEDIDOS_STATUS_SECRET ausente — rota desligada');
    trackRequest(ROUTE, 503);
    return NextResponse.json(
      { ok: false, message: 'Rota não configurada.' },
      { status: 503, headers: apiVersionHeaders() },
    );
  }
  if (!autorizado(req)) {
    trackRequest(ROUTE, 401);
    return NextResponse.json(
      { ok: false, message: 'Não autorizado.' },
      { status: 401, headers: apiVersionHeaders() },
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
      { ok: false, message: 'Dados inválidos.', detalhe: parsed.error.issues[0]?.message },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  const r = await atualizarStatus(parsed.data);
  if (!r.ok) {
    trackRequest(ROUTE, 400);
    return NextResponse.json(
      { ok: false, message: r.erro },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  log.info('status atualizado', { numero: r.numero, status: r.status });
  trackRequest(ROUTE, 200);
  return NextResponse.json(
    { ok: true, numero: r.numero, status: r.status },
    { headers: apiVersionHeaders() },
  );
}
