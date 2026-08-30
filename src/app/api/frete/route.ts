import { NextResponse, type NextRequest } from 'next/server';
import { MASTER_BLOCK_MODELS } from '@/lib/constants/masterblock';
import { baseMelhorEnvio, obterTokenValido, renovarAgora } from '@/lib/melhorenvio/token';

// =============================================================================
// Cálculo de frete — Melhor Envio (POST /api/v2/me/shipment/calculate).
//
// Fica no SERVIDOR por dois motivos: o token não pode ir pro browser, e a CSP
// do site bloqueia chamada do cliente pra domínio externo.
//
// ⛔ Sem token autorizado o endpoint responde `sem_credencial` (200) e o
// checkout segue funcionando — o frete aparece como grátis e o prazo é
// confirmado no pedido. Cotação é melhoria, não requisito da venda.
//
// O token NÃO vem de env: ele expira em 30 dias e a renovação rotaciona o par,
// então mora no banco e se renova sozinho (`lib/melhorenvio/token.ts`).
//
// Env necessárias:
//   MELHOR_ENVIO_CLIENT_ID / _CLIENT_SECRET / _REDIRECT_URI  app do painel
//   MELHOR_ENVIO_CEP_ORIGEM CEP de onde sai a mercadoria
//   MELHOR_ENVIO_UA        User-Agent exigido pela doc: "Nome (email)"
//   MELHOR_ENVIO_SANDBOX   'true' usa sandbox.melhorenvio.com.br
// =============================================================================

type ItemPedido = { model: string; quantidade: number };

/** "150 × 100 × 60" (mm) → cm, que é a unidade do Melhor Envio. */
function dimensoesCm(dim: string): { comprimento: number; largura: number; altura: number } {
  const [a = 0, b = 0, c = 0] = dim.split(/[×x]/).map((n) => parseFloat(n.trim()) || 0);
  const cm = (mm: number) => Math.max(1, Math.round(mm / 10));
  return { comprimento: cm(a), largura: cm(b), altura: cm(c) };
}

type ServicoMelhorEnvio = {
  id: number;
  name: string;
  price: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  company?: { name?: string };
  error?: string;
};

export async function POST(req: NextRequest) {
  const origem = process.env.MELHOR_ENVIO_CEP_ORIGEM;

  const body = (await req.json().catch(() => null)) as
    | { cepDestino?: string; itens?: ItemPedido[] }
    | null;
  const destino = (body?.cepDestino ?? '').replace(/\D/g, '');
  const itens = body?.itens ?? [];

  if (destino.length !== 8 || itens.length === 0) {
    return NextResponse.json({ ok: false, motivo: 'dados_invalidos' }, { status: 400 });
  }

  // Sem credencial o checkout NÃO trava — só não mostra as opções de transporte.
  const token = origem ? await obterTokenValido() : null;
  if (!token || !origem) {
    return NextResponse.json({ ok: false, motivo: 'sem_credencial', opcoes: [] });
  }

  const base = baseMelhorEnvio();

  // products[] com peso/dimensão reais de cada modelo (masterblock.ts).
  const products = itens.flatMap((i) => {
    const m = MASTER_BLOCK_MODELS.find((x) => x.model === i.model);
    if (!m) return [];
    const d = dimensoesCm(m.dim);
    return [{
      id: m.model,
      width: d.largura,
      height: d.altura,
      length: d.comprimento,
      weight: parseFloat(m.weight.replace(',', '.')) || 1,
      insurance_value: m.preco,
      quantity: Math.max(1, i.quantidade),
    }];
  });

  if (products.length === 0) {
    return NextResponse.json({ ok: false, motivo: 'dados_invalidos' }, { status: 400 });
  }

  const cotar = (comToken: string) =>
    fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${comToken}`,
        // A doc do Melhor Envio EXIGE User-Agent identificando a aplicação.
        'User-Agent': process.env.MELHOR_ENVIO_UA ?? 'Somatec Blocking (comercial@somatecblocking.com.br)',
      },
      body: JSON.stringify({
        from: { postal_code: origem.replace(/\D/g, '') },
        to: { postal_code: destino },
        products,
      }),
      signal: AbortSignal.timeout(8000),
    });

  try {
    let r = await cotar(token);

    // 401 antes da margem: o token morreu cedo (revogado, ou `expires_in`
    // otimista). Renova na hora e tenta de novo — uma vez só, pra um token
    // realmente inválido não virar dois erros e o dobro do tempo na tela.
    if (r.status === 401) {
      const novo = await renovarAgora();
      if (novo) r = await cotar(novo);
    }

    if (!r.ok) throw new Error(String(r.status));

    const servicos = (await r.json()) as ServicoMelhorEnvio[];
    const opcoes = (Array.isArray(servicos) ? servicos : [])
      .filter((s) => !s.error && s.price != null)
      .map((s) => ({
        id: s.id,
        nome: s.name,
        transportadora: s.company?.name ?? '',
        valor: Number(s.custom_price ?? s.price) || 0,
        prazoDias: s.delivery_time ?? null,
      }))
      .sort((a, b) => a.valor - b.valor);

    return NextResponse.json({ ok: true, opcoes });
  } catch {
    return NextResponse.json({ ok: false, motivo: 'indisponivel', opcoes: [] }, { status: 502 });
  }
}
