import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { incrementCounter, setGauge } from '@/lib/metrics/registry';

const log = createLogger('audit-archive');

// =============================================================================
// Audit log archive/TTL
//
// admin_activity_log cresce monotonicamente. Para evitar bloat e respeitar LGPD
// (minimização de dados), apagamos registros com created_at < now - retentionDays.
//
// Não há requisito legal de manter logs administrativos por X anos no Brasil
// (não confundir com logs de marco civil, que são para acesso à internet, não
// para ações em CMS interno). 90 dias é janela típica de incident response.
//
// Run via cron ou trigger manual em /api/cron/audit-archive.
// =============================================================================

const DEFAULT_RETENTION_DAYS = Number(process.env.AUDIT_RETENTION_DAYS ?? 90);
const MAX_BATCH = 1000; // limite por execução para evitar timeouts

export type ArchiveResult = {
  cutoff_date: string;
  retention_days: number;
  deleted_count: number;
  remaining_count: number | null;
  duration_ms: number;
};

/**
 * Conta quantos registros estão acima da janela de retenção (sem deletar).
 * Útil para dry-run e métricas.
 */
export async function countExpired(retentionDays = DEFAULT_RETENTION_DAYS): Promise<number | null> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  try {
    const db = getSupabaseAdminClient();
    const { count, error } = await db
      .from('admin_activity_log')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', cutoff);
    if (error) {
      log.warn('countExpired failed', { cutoff }, error);
      return null;
    }
    return count ?? 0;
  } catch (err) {
    log.warn('countExpired threw', undefined, err);
    return null;
  }
}

/**
 * Conta total de registros na tabela (live + expired).
 */
export async function countTotal(): Promise<number | null> {
  try {
    const db = getSupabaseAdminClient();
    const { count, error } = await db
      .from('admin_activity_log')
      .select('id', { count: 'exact', head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

/**
 * Apaga registros mais antigos que retentionDays.
 *
 * Limita a MAX_BATCH por execução para não bloquear o cron. Múltiplas execuções
 * processam grandes backlogs incrementalmente.
 */
export async function archiveExpired(retentionDays = DEFAULT_RETENTION_DAYS): Promise<ArchiveResult> {
  const started = Date.now();
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const cutoff = cutoffDate.toISOString();

  let deleted_count = 0;
  try {
    const db = getSupabaseAdminClient();
    // Primeiro pega IDs (limitando batch) e depois delete por IDs.
    // Mais portável que DELETE...LIMIT que o PostgREST não suporta nativamente.
    const { data: idsRaw, error: selectError } = await db
      .from('admin_activity_log')
      .select('id')
      .lt('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(MAX_BATCH);

    if (selectError) {
      log.warn('archiveExpired select failed', { cutoff }, selectError);
    } else {
      const ids = ((idsRaw as unknown as { id: string }[] | null) ?? []).map((r) => r.id);
      if (ids.length > 0) {
        const { error: delError } = await db.from('admin_activity_log').delete().in('id', ids);
        if (delError) {
          log.warn('archiveExpired delete failed', { cutoff, count: ids.length }, delError);
        } else {
          deleted_count = ids.length;
        }
      }
    }
  } catch (err) {
    log.warn('archiveExpired threw', { cutoff }, err);
  }

  const remaining_count = await countTotal();
  const duration_ms = Date.now() - started;

  // Métricas
  incrementCounter('msm_audit_archive_deleted_total', undefined, deleted_count);
  if (remaining_count !== null) setGauge('msm_audit_log_rows', remaining_count);

  if (deleted_count > 0) {
    log.info('audit archive completed', { deleted_count, remaining_count, duration_ms, cutoff });
  }

  return {
    cutoff_date: cutoff,
    retention_days: retentionDays,
    deleted_count,
    remaining_count,
    duration_ms,
  };
}
