import 'server-only';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type { Json } from '@/types/database';

const log = createLogger('mullerbot-callbacks');

// =============================================================================
// Persistência de callbacks inbound do MullerBot.
//
// Idempotência: idempotency_key UNIQUE no banco. Insert duplicado retorna
// erro 23505 (unique_violation) que tratamos como "já visto" → 200 ok.
// =============================================================================

export const KNOWN_EVENT_TYPES = [
  'lead_received',
  'lead_responded',
  'delivery_failed',
  'lead_completed',
  'lead_cancelled',
] as const;

export type KnownEventType = (typeof KNOWN_EVENT_TYPES)[number];

export const callbackPayloadSchema = z.object({
  event_type: z.string().min(1).max(40),
  idempotency_key: z.string().min(8).max(128).regex(/^[A-Za-z0-9_\-:.]+$/),
  timestamp: z.string().datetime().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type CallbackPayload = z.infer<typeof callbackPayloadSchema>;

export type IngestResult =
  | { mode: 'inserted'; id: string }
  | { mode: 'duplicate' }
  | { mode: 'error'; message: string };

export async function ingestCallback(
  payload: CallbackPayload,
  signatureOk: boolean,
  sourceIp: string | null,
): Promise<IngestResult> {
  try {
    const db = getSupabaseAdminClient();
    const { data, error } = await db
      .from('mullerbot_callbacks')
      .insert({
        idempotency_key: payload.idempotency_key,
        event_type: payload.event_type,
        source_ip: sourceIp,
        signature_ok: signatureOk,
        payload: payload as unknown as Json,
      })
      .select('id')
      .single();

    if (error) {
      // Postgres unique_violation: 23505 (Supabase REST devolve em error.code)
      if (typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505') {
        log.info('duplicate callback (idempotent)', { idempotency_key: payload.idempotency_key });
        return { mode: 'duplicate' };
      }
      log.warn('ingestCallback failed', { idempotency_key: payload.idempotency_key }, error);
      return { mode: 'error', message: (error as { message?: string }).message ?? 'insert failed' };
    }

    return { mode: 'inserted', id: (data as { id: string }).id };
  } catch (err) {
    log.warn('ingestCallback threw', undefined, err);
    return { mode: 'error', message: err instanceof Error ? err.message : 'unknown' };
  }
}
