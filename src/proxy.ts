import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getRedirects } from '@/lib/redirects/cache';

// ---------------------------------------------------------------------------
// Proxy (Next 16+ convention; antes era "middleware")
// Mesma funcionalidade — apenas o nome do arquivo e da export mudaram.
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals (matched by config, but double-check)
  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.');

  // DB redirect lookup (skip for static assets and /api to avoid latency)
  if (!isStatic && !pathname.startsWith('/api') && !pathname.startsWith('/admin')) {
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
