import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { cotarFreteErp } from '@/lib/erp/frete';
import { validateBearer } from '@/lib/auth/bearer';

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

// ⚠️ Zod, não checagem de `.length` na mão. Até 13/09 o corpo era só
// castado, e `itens: "abc"` passava (uma string tem `.length` 3) — aí o
// `montarItens` fazia `.flatMap` numa string e estourava um 500 genérico
// (M6 da auditoria). Também põe teto no tamanho e na quantidade, pra o
// endpoint não virar amplificador contra o ERP.
const freteSchema = z.object({
  cepDestino: z.string().max(20),
  itens: z
    .array(
      z.object({
        model: z.string().min(1).max(60),
        quantidade: z.number().int().min(1).max(99).default(1),
      }),
    )
    .min(1)
    .max(30),
});

export async function POST(req: NextRequest) {
  const corpoBruto = await req.json().catch(() => null);
  const parsed = freteSchema.safeParse(corpoBruto);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, motivo: 'dados_invalidos' }, { status: 400 });
  }
  const destino = parsed.data.cepDestino.replace(/\D/g, '');
  const itens = parsed.data.itens;

  if (destino.length !== 8) {
    return NextResponse.json({ ok: false, motivo: 'dados_invalidos' }, { status: 400 });
  }

  const r = await cotarFreteErp(destino, itens);

  // Diagnóstico. O `detalhe` carrega mensagem interna do ERP (e, num erro de
  // autenticação, pistas sobre a credencial), então só sai pra quem manda
  // `Authorization: Bearer <CRON_SECRET>` — o cliente do checkout nunca vê.
  // Sem isso, investigar falha de cotação em produção vira adivinhação: a
  // resposta é a MESMA ("indisponível") pra ERP fora do ar, timeout, URL
  // errada e payload recusado.
  const { detalhe, ...semDetalhe } = r;
  const podeVerDetalhe = validateBearer(
    req.headers.get('authorization'),
    'CRON_SECRET',
    { requireInProduction: true },
  ).ok;
  const corpo = podeVerDetalhe && detalhe ? { ...semDetalhe, detalhe } : semDetalhe;

  // `indisponivel` é 502 (o ERP falhou de verdade). Credencial ausente ou
  // recusada, produto não vinculado à integração e carrinho sem item cotável
  // são 200: não é erro do servidor, é configuração — e o checkout trata os
  // quatro seguindo em frente, com frete grátis e prazo confirmado no pedido.
  //
  // Importa que produto_nao_vinculado NÃO seja 502: senão o monitoramento
  // acusa o site de erro de servidor enquanto tudo está de pé, e o alerta de
  // ERP fora do ar perde o sentido de tanto tocar à toa.
  return NextResponse.json(corpo, {
    status: !r.ok && r.motivo === 'indisponivel' ? 502 : 200,
  });
}
