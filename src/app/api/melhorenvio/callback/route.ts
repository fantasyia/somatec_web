import { NextResponse, type NextRequest } from 'next/server';
import { stateValido, trocarCodePorToken } from '@/lib/melhorenvio/token';
import { apiVersionHeaders } from '@/lib/http/headers';
import { createLogger } from '@/lib/logger';

const log = createLogger('melhorenvio-callback');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================================================
// Volta do Melhor Envio depois da autorização. Pública por obrigação — quem
// chega aqui é o NAVEGADOR do operador, não dá pra exigir header.
//
// A defesa é o `state`: assinado com o client secret e válido por 15 min. Sem
// ele, qualquer um poderia chamar esta rota com um `code` da própria conta e
// trocar o token que o site usa pra cotar.
//
// Responde em HTML porque quem lê é gente, num navegador, e um JSON cru não
// diz se deu certo.
// =============================================================================

function pagina(titulo: string, detalhe: string, status: number): NextResponse {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${titulo}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1.5rem;line-height:1.6">
<h1 style="font-size:1.25rem">${titulo}</h1><p>${detalhe}</p></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { ...apiVersionHeaders(), 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const erro = url.searchParams.get('error');

  if (erro) {
    return pagina('Autorização não concluída', `O Melhor Envio respondeu: ${erro}.`, 400);
  }
  if (!stateValido(state)) {
    log.warn('callback com state inválido ou vencido');
    return pagina(
      'Link inválido ou vencido',
      'Gere um link novo em /api/melhorenvio/autorizar — cada um vale 15 minutos.',
      401,
    );
  }
  if (!code) {
    return pagina('Faltou o código', 'O Melhor Envio não devolveu o parâmetro <code>code</code>.', 400);
  }

  try {
    await trocarCodePorToken(code);
  } catch (err) {
    log.error('troca do code falhou', { erro: err instanceof Error ? err.message : String(err) });
    return pagina(
      'Não consegui trocar o código pelo token',
      'Confira o client secret e se a URL de callback cadastrada no Melhor Envio é exatamente esta.',
      502,
    );
  }

  return pagina(
    'Melhor Envio conectado',
    'O frete já cota por CEP. O token se renova sozinho — não precisa repetir isto.',
    200,
  );
}
