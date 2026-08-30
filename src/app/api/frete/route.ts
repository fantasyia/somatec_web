import { NextResponse, type NextRequest } from 'next/server';
import { cotarFreteErp } from '@/lib/erp/frete';

// =============================================================================
// Cálculo de frete — cotado pelo ERP (Olist/Tiny), que cota no Melhor Envio.
//
// Fica no SERVIDOR por dois motivos: o token não pode ir pro browser, e a CSP
// do site bloqueia chamada do cliente pra domínio externo.
//
// Por que pelo ERP e não direto no Melhor Envio: o ERP cota usando as formas
// de envio mapeadas no painel, com uma preferencial e alternativas — as mesmas
// que vão emitir a etiqueta. Direto, o site mostraria a mais barata e a
// expedição despacharia por outra. Detalhes em `lib/erp/frete.ts`.
//
// ⛔ Sem credencial o endpoint responde `sem_credencial` (200) e o checkout
// segue: frete grátis e prazo confirmado no pedido.
//
// Env necessárias:
//   ERP_COTACAO_URL  https://erp.olist.com/webhook/api/v1/parceiro/<id>/cotar
//   ERP_API_TOKEN    token da conta no ERP (header `Token`)
//   ERP_CEP_ORIGEM   opcional — sem ele o ERP usa o CEP da empresa
// =============================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ItemPedido = { model: string; quantidade: number };

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { cepDestino?: string; itens?: ItemPedido[] }
    | null;
  const destino = (body?.cepDestino ?? '').replace(/\D/g, '');
  const itens = body?.itens ?? [];

  if (destino.length !== 8 || itens.length === 0) {
    return NextResponse.json({ ok: false, motivo: 'dados_invalidos' }, { status: 400 });
  }

  const r = await cotarFreteErp(destino, itens);

  // `indisponivel` é 502 (o ERP falhou de verdade). Credencial ausente ou
  // recusada e carrinho sem item cotável são 200: não é erro do servidor, é
  // configuração — e o checkout trata os três seguindo em frente, com frete
  // grátis e prazo confirmado no pedido.
  return NextResponse.json(r, { status: !r.ok && r.motivo === 'indisponivel' ? 502 : 200 });
}
