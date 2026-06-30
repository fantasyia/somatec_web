import 'server-only';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type { AdminActivityLog } from '@/types/database';

const log = createLogger('audit-query');

// =============================================================================
// Query helper para admin_activity_log com filtros para BI/auditoria.
// Usado por /api/admin/audit-trail (e potencialmente UI no admin).
// =============================================================================

export const auditQuerySchema = z.object({
  from: z.string().datetime().optional(), // ISO 8601
  to: z.string().datetime().optional(),
  user_email: z.string().email().max(120).optional(),
  user_id: z.string().uuid().optional(),
  action: z.string().max(40).optional(),
  table_name: z.string().max(40).optional(),
  record_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;

export type AuditQueryResult = {
  rows: AdminActivityLog[];
  count: number; // total matching (sem paginação)
  has_more: boolean;
  query: AuditQuery;
};

/**
 * Executa query no admin_activity_log com filtros opcionais.
 * Retorna até `limit` registros + total count para paginação.
 */
export async function queryAuditTrail(query: AuditQuery): Promise<AuditQueryResult> {
  const db = getSupabaseAdminClient();
  let q = db
    .from('admin_activity_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.from) q = q.gte('created_at', query.from);
  if (query.to) q = q.lte('created_at', query.to);
  if (query.user_email) q = q.eq('user_email', query.user_email);
  if (query.user_id) q = q.eq('user_id', query.user_id);
  if (query.action) q = q.eq('action', query.action);
  if (query.table_name) q = q.eq('table_name', query.table_name);
  if (query.record_id) q = q.eq('record_id', query.record_id);

  const { data, count, error } = await q;
  if (error) {
    log.warn('queryAuditTrail failed', { query }, error);
    return { rows: [], count: 0, has_more: false, query };
  }

  const rows = (data as unknown as AdminActivityLog[] | null) ?? [];
  const total = count ?? 0;
  return {
    rows,
    count: total,
    has_more: query.offset + rows.length < total,
    query,
  };
}

// -----------------------------------------------------------------------------
// CSV serialization
// -----------------------------------------------------------------------------

const CSV_HEADERS = [
  'id',
  'created_at',
  'user_id',
  'user_email',
  'action',
  'table_name',
  'record_id',
  'record_label',
  'ip_address',
  'user_agent',
  'changes',
] as const;

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str: string;
  if (typeof value === 'string') str = value;
  else if (typeof value === 'number' || typeof value === 'boolean') str = String(value);
  else str = JSON.stringify(value);

  // Escape se contém vírgula, quote ou newline
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serializa rows como CSV com RFC 4180 escaping.
 * Header line + uma linha por registro.
 */
export function toCsv(rows: AdminActivityLog[]): string {
  const lines: string[] = [];
  lines.push(CSV_HEADERS.join(','));
  for (const row of rows) {
    lines.push(
      CSV_HEADERS.map((h) => escapeCsvField(row[h])).join(','),
    );
  }
  return lines.join('\n') + '\n';
}
