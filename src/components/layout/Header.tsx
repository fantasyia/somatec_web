'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  Menu,
  X,
  Zap,
  Gauge,
  BatteryCharging,
  ClipboardCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { HEADER_NAV, HEADER_CTAS } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils';

// Ícone por solução (mapeado por href — mantém navigation.ts como dados puros).
const SOLUTION_ICON: Record<string, LucideIcon> = {
  '/solucoes/protecao-contra-surtos': Zap,
  '/solucoes/qualidade-de-energia': Gauge,
  '/solucoes/banco-de-capacitores': BatteryCharging,
  '/solucoes/medicao-e-laudos': ClipboardCheck,
  '/solucoes/manutencao-cabine-primaria': Wrench,
};

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hover-intent: abre na hora; fecha com um pequeno atraso para o cursor
  // conseguir cruzar o vão entre o item do nav e o submenu (mega-menu é `fixed`,
  // portanto fica fora da caixa do <nav> — sem o atraso, `onMouseLeave` fecharia
  // o painel antes do mouse chegar nele).
  const openMenu = (href: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setHoveredMenu(href);
  };

  const scheduleCloseMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setHoveredMenu(null);
      closeTimer.current = null;
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Fecha os menus (mobile + mega-menu) ao navegar entre páginas
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setHoveredMenu(null);
  }, [pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const onHome = pathname === '/';
  // Despacho #7: na home o cabeçalho é TRANSPARENTE sobreposto ao carrossel
  // full-bleed (é o que faz ele "ocupar tudo") e vira sólido ao rolar. Menus
  // abertos forçam o sólido pra não flutuar painel sobre foto.
  const isTransparent = onHome && !scrolled && !mobileOpen && hoveredMenu === null;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-200 ease-premium',
        isTransparent
          ? 'bg-transparent border-b border-transparent'
          : scrolled || !onHome
            ? 'backdrop-blur-md bg-[rgb(var(--bg))]/85 border-b border-[rgb(var(--border))]/60'
            : 'bg-[rgb(var(--bg))] border-b border-[rgb(var(--border))]/60',
      )}
    >
      <div className="container-msm flex h-20 items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Somatec Blocking — Página inicial"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Image
            src="/logo-somatec.png"
            alt="Somatec Blocking"
            width={1576}
            height={494}
            priority
            className={cn('h-9 w-auto', isTransparent && 'hidden')}
          />
          <Image
            src="/logo-somatec-white.png"
            alt="Somatec Blocking"
            width={792}
            height={248}
            priority
            className={cn('h-9 w-auto', !isTransparent && 'hidden')}
          />
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-8"
          onMouseLeave={scheduleCloseMenu}
        >
          {HEADER_NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => (hasChildren ? openMenu(item.href) : scheduleCloseMenu())}
                onFocus={hasChildren ? () => openMenu(item.href) : undefined}
                onBlur={
                  hasChildren
                    ? (e) => {
                        // Só fecha se o foco saiu do grupo (trigger + painel),
                        // não ao tabular entre os links do submenu.
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                          scheduleCloseMenu();
                        }
                      }
                    : undefined
                }
                onKeyDown={
                  hasChildren
                    ? (e) => {
                        if (e.key === 'Escape') setHoveredMenu(null);
                      }
                    : undefined
                }
              >
                <Link
                  href={item.href}
                  data-active={isActive}
                  aria-haspopup={hasChildren ? true : undefined}
                  aria-expanded={hasChildren ? hoveredMenu === item.href : undefined}
                  className={cn(
                    'link-underline text-sm font-sans font-medium hover:text-gold transition-colors py-2',
                    isTransparent ? 'text-white/90' : 'text-[rgb(var(--text))]/90',
                  )}
                >
                  {item.label}
                </Link>

                {/* Mega menu — Soluções */}
                {hasChildren && item.label === 'Soluções' && hoveredMenu === item.href && (
                  <div
                    className="fixed left-0 right-0 top-20 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))]/95 backdrop-blur-md shadow-premium-light dark:shadow-premium-dark animate-fade-up"
                  >
                    {/* Handlers no container (não no painel full-width): só a área
                        dos cards mantém o menu aberto — a lateral vazia fecha. */}
                    <div
                      className="container-msm py-10"
                      onMouseEnter={() => openMenu(item.href)}
                      onMouseLeave={scheduleCloseMenu}
                    >
                      <div className="grid grid-cols-3 gap-4">
                        {item.children!.map((child) => {
                          const Icon = SOLUTION_ICON[child.href];
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="group flex items-start gap-4 p-5 rounded-card border border-transparent hover:border-gold hover:bg-gold/5 transition-all duration-200 ease-premium"
                            >
                              {Icon && (
                                <Icon
                                  className="h-8 w-8 flex-shrink-0 text-gold"
                                  strokeWidth={1.5}
                                  aria-hidden="true"
                                />
                              )}
                              <div className="min-w-0">
                                <h3 className="font-sans font-semibold text-[17px] leading-snug group-hover:text-gold transition-colors">
                                  {child.label}
                                </h3>
                                {child.description && (
                                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))] leading-relaxed">
                                    {child.description}
                                  </p>
                                )}
                                <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                  Saiba mais
                                  <ChevronRight className="h-3 w-3" strokeWidth={2} />
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dropdown vertical — A Somatec */}
                {hasChildren && item.label === 'A Somatec' && hoveredMenu === item.href && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full pt-3 min-w-[240px]"
                    onMouseEnter={() => openMenu(item.href)}
                    onMouseLeave={scheduleCloseMenu}
                  >
                    <div className="rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-premium-light dark:shadow-premium-dark p-2 animate-fade-up">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-3 py-2 rounded text-sm hover:bg-[rgb(var(--surface-elevated))] hover:text-gold transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* CTAs + Theme toggle */}
        <div className="flex items-center gap-3">
          <Link
            href={HEADER_CTAS.representative.href}
            className={cn(
              'hidden md:inline-flex btn-secondary',
              isTransparent
                ? 'border-white/40 text-white hover:border-white'
                : 'text-[rgb(var(--text))]',
            )}
          >
            {HEADER_CTAS.representative.label}
          </Link>
          <Link href={HEADER_CTAS.commercial.href} className="hidden md:inline-flex btn-primary">
            {HEADER_CTAS.commercial.label}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
          {/* Mobile menu trigger */}
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            className={cn(
              'lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border hover:border-gold transition-colors',
              isTransparent
                ? 'border-white/40 text-white'
                : 'border-[rgb(var(--border))]',
            )}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-deep_navy/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-[rgb(var(--bg))] border-l border-[rgb(var(--border))] shadow-premium-light dark:shadow-premium-dark overflow-y-auto">
            <div className="flex h-20 items-center justify-between px-6 border-b border-[rgb(var(--border))]">
              <Image
                src="/logo-somatec.png"
                alt="Somatec Blocking"
                width={1576}
                height={494}
                className="h-8 w-auto dark:hidden"
              />
              <Image
                src="/logo-somatec-white.png"
                alt="Somatec Blocking"
                width={792}
                height={248}
                className="hidden h-8 w-auto dark:block"
              />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(var(--border))] hover:border-gold transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navegação mobile" className="px-6 py-6 space-y-1">
              {HEADER_NAV.map((item) => (
                <div key={item.href} className="py-1">
                  <Link
                    href={item.href}
                    className="block py-3 font-sans font-semibold text-base hover:text-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-3 pl-4 border-l border-[rgb(var(--border))] space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block py-2 text-sm text-[rgb(var(--text-muted))] hover:text-gold transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-6 mt-6 border-t border-[rgb(var(--border))] space-y-3">
                <Link href={HEADER_CTAS.representative.href} className="btn-secondary w-full text-[rgb(var(--text))]">
                  {HEADER_CTAS.representative.label}
                </Link>
                <Link href={HEADER_CTAS.commercial.href} className="btn-primary w-full">
                  {HEADER_CTAS.commercial.label}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
