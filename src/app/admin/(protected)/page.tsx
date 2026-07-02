import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Home, Megaphone, FileText, Image,
  Globe, Navigation, AlignEndHorizontal as AlignBottom, Settings,
  ArrowLeftRight, ClipboardList, HeartPulse, MessageCircle,
} from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { getQueueHealth } from '@/lib/webhook-queue';

export const metadata: Metadata = { title: 'Dashboard — Admin Somatec' };

const MODULES = [
  { label: 'Home', href: '/admin/home', icon: Home, desc: 'Hero, carrossel, indicadores, CTA' },
  { label: 'Banners', href: '/admin/banners', icon: Megaphone, desc: 'Banners promocionais' },
  { label: 'Páginas', href: '/admin/paginas', icon: FileText, desc: 'Páginas institucionais' },
  { label: 'Mídias', href: '/admin/midias', icon: Image, desc: 'Upload e gestão de arquivos' },
  { label: 'SEO Global', href: '/admin/seo', icon: Globe, desc: 'Metadados e configurações SEO' },
  { label: 'Navegação', href: '/admin/navegacao', icon: Navigation, desc: 'Itens do menu' },
  { label: 'Footer', href: '/admin/footer', icon: AlignBottom, desc: 'Colunas e links do rodapé' },
  { label: 'WhatsApp', href: '/admin/whatsapp', icon: MessageCircle, desc: 'Botão e mensagens de WhatsApp' },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings, desc: 'Parâmetros do site' },
  { label: 'Redirects', href: '/admin/redirects', icon: ArrowLeftRight, desc: 'Redirecionamentos URL' },
  { label: 'Audit Log', href: '/admin/audit', icon: ClipboardList, desc: 'Histórico de ações' },
  { label: 'Integração', href: '/admin/integracao', icon: HeartPulse, desc: 'Saúde do webhook de leads' },
];

async function getStats() {
  const health = await getQueueHealth();
  return { health };
}

export default async function AdminDashboard() {
  const [user, stats] = await Promise.all([requireAdmin(), getStats()]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-[rgb(var(--text))]">
          {greeting}, {user.profile.full_name ?? user.email.split('@')[0]}
        </h1>
        <p className="text-sm text-[rgb(var(--text-muted))]/80 mt-1">Painel de administração Somatec Blocking</p>
      </div>

      {/* Integration health strip */}
      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/40 px-5 py-4 mb-10 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${stats.health.configured ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
          <span className="text-sm text-[rgb(var(--text-muted))]">
            Webhook de leads{' '}
            <span className={stats.health.configured ? 'text-emerald-400' : 'text-amber-400'}>
              {stats.health.configured ? 'configurado' : 'não configurado'}
            </span>
          </span>
        </div>
        <div className="text-sm text-[rgb(var(--text-muted))]">
          Últimas 24h: <span className="text-[rgb(var(--text))]/85">{stats.health.sent_24h}/{stats.health.total_24h}</span> enviados
        </div>
        {stats.health.dead > 0 && (
          <div className="text-sm text-red-400">
            {stats.health.dead} na fila morta
          </div>
        )}
        {stats.health.pending + stats.health.failed > 0 && (
          <div className="text-sm text-amber-400">
            {stats.health.pending + stats.health.failed} pendentes
          </div>
        )}
        <Link href="/admin/integracao" className="ml-auto text-xs text-gold hover:underline">
          Ver detalhes →
        </Link>
      </div>

      {/* Module grid */}
      <h2 className="text-xs font-sans font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]/70 mb-4">
        Módulos
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 p-4 hover:border-gold/30 hover:bg-[rgb(var(--surface))]/60 transition-all"
            >
              <Icon
                className="h-5 w-5 text-gold/60 group-hover:text-gold transition-colors mb-3"
                strokeWidth={1.5}
              />
              <p className="text-sm font-medium text-[rgb(var(--text))]/85 group-hover:text-[rgb(var(--text))] transition-colors leading-tight">
                {m.label}
              </p>
              <p className="text-[11px] text-[rgb(var(--text-muted))]/70 mt-1 leading-tight line-clamp-2">
                {m.desc}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
