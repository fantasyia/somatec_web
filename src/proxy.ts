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

  // Páginas de auth públicas do admin: precisam ser acessíveis SEM sessão
  // (login + recuperação de senha). O resto de /admin/* é protegido.
  const isPublicAdminPath =
    pathname === '/admin/login' ||
    pathname === '/admin/esqueci-senha' ||
    pathname === '/admin/redefinir-senha';

  // Protect /admin/* routes (except the public auth pages above)
  if (pathname.startsWith('/admin') && !isPublicAdminPath) {
    const response = await updateSession(request);

    // requireAdmin() in the layout is the real guard; this early check avoids
    // rendering the admin shell for clearly unauthenticated requests.
    const hasSession =
      request.cookies.getAll().some((c) => c.name.includes('auth-token')) ||
      request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

    if (!hasSession) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
