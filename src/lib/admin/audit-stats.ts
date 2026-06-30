import 'server-only';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('audit-stats');

// =============================================================================
// Agregações de admin_activity_log para dashboard / BI.
//
// Diferentes da `/audit-trail`: aqui retornamos contagens agrupadas, não as
// linhas brutas. Útil para visualizar atividade no painel admin sem baixar
// milhares de registros.
// =============================================================================

export const auditStatsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  top: z.coerce.number().int().min(1).max(50).default(10),
});

export type AuditStatsQuery = z.infer<typeof auditStatsQuerySchema>;

export type AuditStats = {
  total: number;
  by_action: Array<{ action: string; count: number }>;
  by_table: Array<{ table_name: string; count: number }>;
  by_user: Array<{ user_email: string; count: number }>;
  per_day: Array<{ date: string; count: number }>;
  date_range: { from: string | null; to: string | null };
};

type Row = {
  action: string | null;
  table_name: string | null;
  user_email: string | null;
  created_at: string;
};

/**
 * Conta valores agrupados em uma lista de rows e retorna top-N ordenado desc.
 * Pura, exportada para testes diretos sem mock de Supabase.
 */
export function aggregateBy<K extends keyof Row>(
  rows: Row[],
  key: K,
  top: number,
): Array<{ value: string; count: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const v = row[key];
    if (v === null || v === undefined) continue;
    const str = String(v);
    map.set(str, (map.get(str) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

/**
 * Conta por dia (YYYY-MM-DD UTC). Inclui dias vazios DENTRO do range
 * (entre o primeiro e último dia com atividade) para gráficos suaves.
 */
export function aggregatePerDay(rows: Row[]): Array<{ date: string; count: number }> {
  if (rows.length === 0) return [];
  const counts = new Map<string, number>();
  for (const row of rows) {
    const day = row.created_at.slice(0, 10); // YYYY-MM-DD
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const days = Array.from(counts.keys()).sort();
  const start = new Date(days[0]!);
  const end = new Date(days[days.length - 1]!);
  const result: Array<{ date: string; count: number }> = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return result;
}

export async function getAuditStats(query: AuditStatsQuery): Promise<AuditStats> {
  const db = getSupabaseAdminClient();
  let q = db
    .from('admin_activity_log')
    .select('action,table_name,user_email,created_at');

  if (query.from) q = q.gte('created_at', query.from);
  if (query.to) q = q.lte('created_at', query.to);

  const { data, error } = await q;
  if (error) {
    log.warn('getAuditStats failed', { query }, error);
    return {
      total: 0,
      by_action: [],
      by_table: [],
      by_user: [],
      per_day: [],
      date_range: { from: query.from ?? null, to: query.to ?? null },
    };
  }
  const rows = (data as unknown as Row[] | null) ?? [];

  const byAction = aggregateBy(rows, 'action', query.top).map((e) => ({ action: e.value, count: e.count }));
  const byTable = aggregateBy(rows, 'table_name', query.top).map((e) => ({ table_name: e.value, count: e.count }));
  const byUser = aggregateBy(rows, 'user_email', query.top).map((e) => ({ user_email: e.value, count: e.count }));

  return {
    total: rows.length,
    by_action: byAction,
    by_table: byTable,
    by_user: byUser,
    per_day: aggregatePerDay(rows),
    date_range: { from: query.from ?? null, to: query.to ?? null },
  };
}
