'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';

type Props = {
  children: React.ReactNode;
  userEmail: string;
};

export function AdminShell({ children, userEmail }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full">
            <AdminSidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden rounded-lg p-2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-elevated))] transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div className="lg:hidden font-serif text-sm font-semibold">MSM Admin</div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[rgb(var(--text-muted))] hidden sm:block">{userEmail}</span>
            <div className="h-7 w-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-gold uppercase">
                {userEmail.charAt(0)}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
