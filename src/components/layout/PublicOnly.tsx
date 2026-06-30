'use client';

import { usePathname } from 'next/navigation';

/**
 * Wrapper que esconde o chrome público (Header, Footer, CookieBanner, FAB)
 * quando o usuário está em rotas do admin. O painel admin tem o seu próprio
 * shell (AdminShell) e não deve renderizar a navegação institucional por cima.
 */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <>{children}</>;
}
