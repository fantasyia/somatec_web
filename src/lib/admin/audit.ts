import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type { Json } from '@/types/database';
import { getClientIp } from '@/lib/http/client-ip';

const log = createLogger('audit');

type LogActivityParams = {
  userId: string;
  userEmail: string;
  action: string;
  tableName?: string;
  recordId?: string;
  recordLabel?: string;
  changes?: Json;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Records an admin action to admin_activity_log.
 * Never throws — audit failures are logged but never block the operation.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from('admin_activity_log').insert({
      user_id: params.userId,
      user_email: params.userEmail,
      action: params.action,
      table_name: params.tableName ?? null,
      record_id: params.recordId ?? null,
      record_label: params.recordLabel ?? null,
      changes: params.changes ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    });
  } catch (err) {
    log.warn('failed to log activity', undefined, err);
  }
}

/**
 * Extracts request metadata for audit logging.
 */
export function getRequestMeta(request: Request): { ipAddress: string; userAgent: string } {
  const ipAddress = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  return { ipAddress, userAgent };
}
