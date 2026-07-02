'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Megaphone,
  FileText,
  Image,
  Globe,
  Navigation,
  AlignEndHorizontal as AlignBottom,
  Settings,
  MessageCircle,
  ArrowLeftRight,
  ClipboardList,
  HeartPulse,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  group?: string;
};

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },

  { label: 'Home', href: '/admin/home', icon: Home, group: 'Conteúdo' },
  { label: 'Banners', href: '/admin/banners', icon: Megaphone, group: 'Conteúdo' },
  { label: 'Páginas', href: '/admin/paginas', icon: FileText, group: 'Conteúdo' },
  { label: 'Mídias', href: '/admin/midias', icon: Image, group: 'Conteúdo' },

  { label: 'SEO Global', href: '/admin/seo', icon: Globe, group: 'Configuração' },
  { label: 'Navegação', href: '/admin/navegacao', icon: Navigation, group: 'Configuração' },
  { label: 'Footer', href: '/admin/footer', icon: AlignBottom, group: 'Configuração' },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings, group: 'Configuração' },
  { label: 'WhatsApp', href: '/admin/whatsapp', icon: MessageCircle, group: 'Configuração' },

  { label: 'Redirects', href: '/admin/redirects', icon: ArrowLeftRight, group: 'Sistema' },
  { label: 'Log de Auditoria', href: '/admin/audit', icon: ClipboardList, group: 'Sistema' },
  { label: 'Integração', href: '/admin/integracao', icon: HeartPulse, group: 'Sistema' },
];

type Props = {
  onClose?: () => void;
  mobile?: boolean;
};

export function AdminSidebar({ onClose, mobile }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  // Group items
  const groups = ['', 'Conteúdo', 'Configuração', 'Sistema'];

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-[rgb(var(--surface))] border-r border-[rgb(var(--border))] select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[rgb(var(--border))]">
        <div>
          <span className="font-serif text-lg font-semibold text-[rgb(var(--text))]">Somatec</span>
          <span className="ml-2 text-[10px] font-sans uppercase tracking-[0.1em] text-gold/80">Admin</span>
        </div>
        {mobile && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-elevated))] transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {groups.map((group) => {
          const items = group
            ? NAV.filter((i) => i.group === group)
            : NAV.filter((i) => !i.group);
          if (items.length === 0) return null;

          return (
            <div key={group || '_root'} className="mb-4">
              {group && (
                <p className="px-3 mb-1 text-[10px] font-sans font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]/70">
                  {group}
                </p>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-sans transition-colors mb-0.5',
                      active
                        ? 'bg-gold/15 text-gold font-medium'
                        : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-elevated))]',
                    )}
                  >
                    <Icon
                      className={cn('h-4 w-4 flex-shrink-0', active ? 'text-gold' : 'text-[rgb(var(--text-muted))]/70')}
                      strokeWidth={active ? 2 : 1.5}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[rgb(var(--border))]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-sans text-[rgb(var(--text-muted))] hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          Sair
        </button>
      </div>
    </aside>
  );
}
