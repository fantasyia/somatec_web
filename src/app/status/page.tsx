import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { collectQueueStats, probeSupabase } from '@/lib/alerts/monitor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Status do sistema — Somatec Blocking',
  description: 'Estado operacional do site da Somatec Blocking em tempo real.',
  robots: { index: false, follow: false },
};

type ComponentStatus = {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  description: string;
};

function statusToLabel(s: ComponentStatus['status']): { label: string; classes: string; dotClasses: string } {
  switch (s) {
    case 'operational':
      return {
        label: 'Operacional',
        classes: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200/60 dark:border-green-800/40',
        dotClasses: 'bg-green-500',
      };
    case 'degraded':
      return {
        label: 'Degradado',
        classes: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200/60 dark:border-yellow-800/40',
        dotClasses: 'bg-yellow-500',
      };
    case 'down':
      return {
        label: 'Indisponível',
        classes: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-800/40',
        dotClasses: 'bg-red-500',
      };
  }
}

async function getComponents(): Promise<ComponentStatus[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseValid = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.');

  if (!supabaseValid) {
    return [
      { name: 'Site', status: 'operational', description: 'Páginas carregam normalmente.' },
      { name: 'Formulários', status: 'down', description: 'Configuração de backend ausente.' },
      { name: 'Painel admin', status: 'down', description: 'Configuração de backend ausente.' },
    ];
  }

  // Probe rápida do Supabase + queue
  const [supabase, queue] = await Promise.all([probeSupabase(), collectQueueStats()]);

  // Site: sempre operacional se a página renderizou
  const site: ComponentStatus = {
    name: 'Site',
    status: 'operational',
    description: 'Páginas e conteúdo institucional acessíveis.',
  };

  // Formulários: depende de Supabase (queue de retry) + MullerBot config
  const mullerbotConfigured = Boolean(process.env.MULLERBOT_WEBHOOK_URL && process.env.MULLERBOT_API_KEY);
  let formsStatus: ComponentStatus['status'] = 'operational';
  let formsDesc = 'Contatos são entregues normalmente.';
  if (!supabase.ok) {
    formsStatus = 'down';
    formsDesc = 'Backend de persistência indisponível.';
  } else if (!mullerbotConfigured) {
    formsStatus = 'degraded';
    formsDesc = 'Mensagens são aceitas mas a integração comercial está em manutenção.';
  } else if (queue && queue.oldest_pending_age_seconds !== null && queue.oldest_pending_age_seconds > 1800) {
    formsStatus = 'degraded';
    formsDesc = 'Pequeno atraso na entrega de mensagens ao time comercial.';
  } else if (queue && queue.dead > 10) {
    formsStatus = 'degraded';
    formsDesc = 'Algumas mensagens recentes falharam — equipe técnica notificada.';
  }
  const forms: ComponentStatus = { name: 'Formulários de contato', status: formsStatus, description: formsDesc };

  // Painel admin: depende do Supabase
  const admin: ComponentStatus = {
    name: 'Painel administrativo',
    status: supabase.ok ? 'operational' : 'down',
    description: supabase.ok
      ? 'Login e edição de conteúdo disponíveis.'
      : 'Banco de dados temporariamente indisponível.',
  };

  return [site, forms, admin];
}

function overall(components: ComponentStatus[]): ComponentStatus['status'] {
  if (components.some((c) => c.status === 'down')) return 'down';
  if (components.some((c) => c.status === 'degraded')) return 'degraded';
  return 'operational';
}

export default async function StatusPage() {
  const components = await getComponents();
  const summary = overall(components);
  const summaryUi = statusToLabel(summary);
  const lastChecked = new Date();

  return (
    <>
      <PageHero
        eyebrow="Operações"
        title="Status do sistema"
        description="Estado dos serviços do site da Somatec Blocking em tempo real."
        breadcrumbs={[{ label: 'Status' }]}
      />

      <section className="container-msm py-10 md:py-14 space-y-10">
        {/* Status geral */}
        <div className={`rounded-card border ${summaryUi.classes} px-6 py-5 flex items-center gap-4`}>
          <span className={`inline-block h-3 w-3 rounded-full ${summaryUi.dotClasses}`} aria-hidden="true" />
          <div>
            <div className="font-sans font-semibold">
              {summary === 'operational' && 'Todos os sistemas operacionais'}
              {summary === 'degraded' && 'Operação parcial'}
              {summary === 'down' && 'Incidente em curso'}
            </div>
            <div className="text-xs opacity-80 mt-0.5">
              Última verificação: {lastChecked.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
        </div>

        {/* Componentes */}
        <div className="space-y-3">
          <h2 className="font-sans font-semibold text-sm uppercase tracking-widest text-[rgb(var(--text-muted))]">
            Componentes
          </h2>
          <ul className="rounded-card border border-[rgb(var(--border))] divide-y divide-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            {components.map((c) => {
              const ui = statusToLabel(c.status);
              return (
                <li key={c.name} className="flex items-center gap-4 px-5 py-4">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${ui.dotClasses}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-semibold text-[rgb(var(--text))]">{c.name}</div>
                    <div className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{c.description}</div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${ui.classes}`}
                  >
                    {ui.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Reload note */}
        <p className="text-xs text-[rgb(var(--text-muted))]">
          Esta página é atualizada a cada acesso. Para integração programática, use{' '}
          <a href="/api/health" className="underline hover:text-gold">/api/health</a>.
        </p>
      </section>
    </>
  );
}
