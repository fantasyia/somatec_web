import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getQueueHealth } from '@/lib/webhook-queue';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata: Metadata = { title: 'Integração — Admin Somatec' };

export default async function IntegracaoPage() {
  await requireAdmin();

  const [health, { data: queue }] = await Promise.all([
    getQueueHealth(),
    getSupabaseAdminClient()
      .from('webhook_retry_queue')
      .select('id, status, attempts, max_attempts, last_error, next_attempt_at, source_page, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const successRate = health.total_24h > 0
    ? Math.round(health.success_rate_24h * 100)
    : null;

  return (
    <div>
      <PageHeader title="Integração MullerBot" description="Fila de webhook e saúde do sistema"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Integração' }]} />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Health cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HealthCard label="Status MullerBot" value={health.configured ? 'Configurado' : 'Não configurado'} color={health.configured ? 'emerald' : 'amber'} />
          <HealthCard label="Enviados (24h)" value={`${health.sent_24h} / ${health.total_24h}`} color="default" />
          <HealthCard label="Taxa de sucesso (24h)" value={successRate !== null ? `${successRate}%` : 'N/A'} color={successRate !== null && successRate >= 95 ? 'emerald' : successRate !== null ? 'amber' : 'default'} />
          <HealthCard label="Pendentes / Com falha / Mortos" value={`${health.pending} / ${health.failed} / ${health.dead}`} color={health.dead > 0 ? 'red' : health.pending + health.failed > 0 ? 'amber' : 'default'} />
        </div>

        {!health.configured && (
          <div className="rounded-xl border border-amber-800/40 bg-amber-900/20 px-5 py-4 text-sm text-amber-300">
            <strong>Atenção:</strong> As variáveis <code className="font-mono text-amber-200 bg-black/20 px-1 rounded">MULLERBOT_WEBHOOK_URL</code> e <code className="font-mono text-amber-200 bg-black/20 px-1 rounded">MULLERBOT_API_KEY</code> não estão configuradas. Formulários enviados ficam em fila para quando a integração for ativada.
          </div>
        )}

        {/* Queue */}
        <div>
          <h2 className="text-xs font-semibold text-[rgb(var(--text-muted))]/70 uppercase tracking-[0.08em] mb-3">
            Fila de webhook (últimas 100 entradas)
          </h2>
          <AdminTable
            rows={(queue ?? []).map((r) => ({ ...r, id: r.id as string }))}
            keyField="id"
            columns={[
              { key: 'time', header: 'Criado', className: 'w-36 whitespace-nowrap', render: (r) => <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]/80">{new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span> },
              { key: 'status', header: 'Status', className: 'w-28', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'attempts', header: 'Tentativas', className: 'w-24', render: (r) => <span className="text-[12px] text-[rgb(var(--text-muted))]">{r.attempts} / {r.max_attempts}</span> },
              { key: 'source', header: 'Página', render: (r) => <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]/80">{r.source_page ?? '—'}</span> },
              { key: 'error', header: 'Último erro', render: (r) => <span className="text-[11px] text-red-400/70 truncate block max-w-[300px]">{r.last_error ?? '—'}</span> },
              { key: 'next', header: 'Próxima tentativa', className: 'w-40', render: (r) => (
                r.status === 'pending' || r.status === 'failed'
                  ? <span className="text-[11px] text-amber-400">{new Date(r.next_attempt_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  : <span className="text-[11px] text-white/20">—</span>
              )},
            ]}
            empty="Fila vazia."
          />
        </div>
      </div>
    </div>
  );
}

function HealthCard({ label, value, color }: { label: string; value: string; color: 'emerald' | 'amber' | 'red' | 'default' }) {
  const valueColor = color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : 'text-[rgb(var(--text))]';
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/40 px-5 py-4">
      <p className={`text-xl font-semibold ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-[rgb(var(--text-muted))]/70 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
