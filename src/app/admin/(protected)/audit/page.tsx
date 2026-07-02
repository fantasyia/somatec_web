import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable } from '@/components/admin/AdminTable';

export const metadata: Metadata = { title: 'Log de Auditoria — Admin Somatec' };

export default async function AuditPage() {
  await requireAdmin();
  const { data } = await getSupabaseAdminClient()
    .from('admin_activity_log')
    .select('id, user_email, action, table_name, record_label, ip_address, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader title="Log de Auditoria" description="Últimas 200 ações administrativas"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Log' }]} />
      <AdminTable
        rows={data ?? []}
        keyField="id"
        columns={[
          { key: 'time', header: 'Data/hora', className: 'w-40 whitespace-nowrap', render: (r) => (
            <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]/80">
              {new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          )},
          { key: 'user', header: 'Usuário', render: (r) => <span className="text-[12px] text-white/70">{r.user_email ?? '—'}</span> },
          { key: 'action', header: 'Ação', render: (r) => (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
              r.action === 'delete' ? 'bg-red-900/30 text-red-400' :
              r.action === 'create' ? 'bg-emerald-900/30 text-emerald-400' :
              r.action === 'admin_login' ? 'bg-blue-900/30 text-blue-400' :
              'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-muted))]'
            }`}>{r.action}</span>
          )},
          { key: 'table', header: 'Tabela', render: (r) => <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]/80">{r.table_name ?? '—'}</span> },
          { key: 'label', header: 'Registro', render: (r) => <span className="text-[12px] text-[rgb(var(--text-muted))] truncate max-w-[200px] block">{r.record_label ?? '—'}</span> },
          { key: 'ip', header: 'IP', className: 'w-32', render: (r) => <span className="font-mono text-[11px] text-[rgb(var(--text-muted))]/60">{r.ip_address ?? '—'}</span> },
        ]}
        empty="Nenhuma ação registrada."
      />
    </div>
  );
}
