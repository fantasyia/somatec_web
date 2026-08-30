import { NextResponse, type NextRequest } from 'next/server';
import { validateBearer } from '@/lib/auth/bearer';
import { configurado, urlDeAutorizacao } from '@/lib/melhorenvio/token';
import { apiVersionHeaders } from '@/lib/http/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================================================
// Monta o link de autorização do Melhor Envio. Uso de OPERADOR, uma vez só.
//
// ⛔ Protegida por CRON_SECRET, e não por comodidade: quem chama esta rota
// cunha o `state` assinado que o callback aceita. Aberta, um estranho
// autorizaria a CONTA DELE aqui — e as cotações do site passariam a sair da
// carteira de outra pessoa, sem nada na tela denunciando.
//
// Fluxo: chame com o Bearer, abra a URL devolvida no navegador logado no
// Melhor Envio, autorize. O callback grava o token e a partir daí o site
// renova sozinho.
// =============================================================================

export async function GET(req: NextRequest) {
  const check = validateBearer(req.headers.get('authorization'), 'CRON_SECRET', {
    requireInProduction: true,
  });
  if (!check.ok) {
    if (check.reason === 'missing_secret') {
      return NextResponse.json({ ok: false, erro: 'CRON_SECRET não configurado' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, erro: 'não autorizado' }, { status: 401 });
  }

  if (!configurado()) {
    return NextResponse.json(
      {
        ok: false,
        erro:
          'Faltam MELHOR_ENVIO_CLIENT_ID, MELHOR_ENVIO_CLIENT_SECRET e MELHOR_ENVIO_REDIRECT_URI.',
      },
      { status: 503, headers: apiVersionHeaders() },
    );
  }

  return NextResponse.json({ ok: true, url: urlDeAutorizacao() }, { headers: apiVersionHeaders() });
}
