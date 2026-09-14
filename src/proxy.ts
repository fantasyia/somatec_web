import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getRedirects } from '@/lib/redirects/cache';

// ---------------------------------------------------------------------------
// Proxy (Next 16+ convention; antes era "middleware")
// Mesma funcionalidade — apenas o nome do arquivo e da export mudaram.
// ---------------------------------------------------------------------------

/** Domínio canônico do site. Tudo que chegar no apex vai pra cá. */
const HOST_CANONICO = 'www.somatecblocking.com.br';
const HOST_APEX = 'somatecblocking.com.br';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── APEX → WWW (A8 da auditoria 13/09) ────────────────────────────────
  //
  // `https://somatecblocking.com.br/` respondia 200 com o site INTEIRO, e
  // `http://` no apex fazia 301 pro `https://` do próprio apex — nunca pro
  // www. Duas origens rastreáveis servindo o mesmo conteúdo: orçamento de
  // crawl dividido, e link externo pro apex não consolidando. O canonical
  // aponta pro www em ambas, mas canonical é DICA; 301 é diretiva.
  //
  // Só o apex de produção entra aqui — localhost, o host do Railway e
  // qualquer preview seguem intactos.
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] ?? '';
  if (host === HOST_APEX) {
    const destino = new URL(request.url);
    destino.host = HOST_CANONICO;
    destino.protocol = 'https:';
    destino.port = '';
    return NextResponse.redirect(destino, { status: 301 });
  }

  // Skip static assets and Next.js internals (matched by config, but double-check)
  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.');

  // DB redirect lookup (skip for static assets and /api to avoid latency)
  if (!isStatic && !pathname.startsWith('/api')) {
    const redirects = await getRedirects();
    const match = redirects.get(pathname);
    if (match) {
      const destination = new URL(match.to_path, request.url);
      // Preserve original query string
      request.nextUrl.searchParams.forEach((v, k) => destination.searchParams.set(k, v));
      return NextResponse.redirect(destination, { status: match.status_code });
    }
  }

  // O /admin do site saiu (decisão do Léo, 25/08): o painel do blog é o Mini
  // WordPress, e o resto do que ele editava passa a ser mexido por código.
  // A proteção de rota que existia aqui virou desnecessária — sem as páginas,
  // /admin/* é 404 como qualquer outra rota inexistente.

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
