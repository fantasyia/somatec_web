import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { withTiming } from '@/lib/perf/timing';
import { computeAttempt } from '@/lib/webhook-queue/backoff';
import type { MullerBotPayload } from '@/lib/mullerbot/payload';
import type { SendOutcome } from '@/lib/mullerbot/client';
import type { Json } from '@/types/database';

const log = createLogger('queue');

// v1.1 §2 — Fila técnica de transporte. NÃO é interface de leads.

// O submit faz um envio síncrono logo após enfileirar. Adiamos o primeiro
// next_attempt_at por esta janela para o cron NÃO pegar a mesma linha durante esse
// envio (que resolve em ≤8s) — evita entrega dupla submit↔cron sem precisar de
// claim/migração. Se o síncrono morrer, o cron entrega normalmente após a janela.
const SYNC_SEND_GRACE_MS = 90_000;

export type EnqueueInput = {
  idempotencyKey: string;
  payload: MullerBotPayload;
  sourcePage: string | null;
  sourceIp: string | null;
};

export async function enqueueSubmission(input: EnqueueInput): Promise<void> {
  await withTiming('queue:enqueue', async () => {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('webhook_retry_queue').insert({
      destination: 'mullerbot',
      idempotency_key: input.idempotencyKey,
      payload: input.payload as unknown as Json,
      status: 'pending',
      attempts: 0,
      next_attempt_at: new Date(Date.now() + SYNC_SEND_GRACE_MS).toISOString(),
      source_page: input.sourcePage,
      source_ip: input.sourceIp,
    });
    if (error) {
      throw new Error(`enqueue failed: ${error.message}`);
    }
  });
}

export async function markSent(
  idempotencyKey: string,
  httpStatus: number,
  externalId: string | null,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('webhook_retry_queue')
    .update({
      status: 'sent',
      sent_at: now,
      last_attempted_at: now,
      last_error: null,
    })
    .eq('idempotency_key', idempotencyKey);
  if (error) {
    log.warn('markSent update failed', { idempotencyKey, httpStatus, externalId }, error);
  } else {
    log.info('mullerbot send confirmed', { idempotencyKey, httpStatus, externalId });
  }
}

export async function markAttempt(
  idempotencyKey: string,
  outcome: SendOutcome,
  currentAttempts: number,
  maxAttempts = 5,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { status, attempts, lastError, backoffSec } = computeAttempt({
    outcome,
    currentAttempts,
    maxAttempts,
  });
  const nextAttempt = new Date(Date.now() + backoffSec * 1000).toISOString();

  await supabase
    .from('webhook_retry_queue')
    .update({
      status,
      attempts,
      last_attempted_at: now,
      next_attempt_at: nextAttempt,
      last_error: lastError,
    })
    .eq('idempotency_key', idempotencyKey);
}

export type QueueRow = {
  id: string;
  idempotency_key: string;
  payload: MullerBotPayload;
  attempts: number;
  max_attempts: number;
};

export async function fetchDuePending(limit: number): Promise<QueueRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('webhook_retry_queue')
    .select('id, idempotency_key, payload, attempts, max_attempts')
    .in('status', ['pending', 'failed'])
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(limit);
  if (error) {
    log.warn('fetchDuePending error', undefined, error);
    return [];
  }
  // Cast: jsonb payload é validado no envio
  return (data ?? []) as unknown as QueueRow[];
}

// ===== Painel de saúde (Fase 5) =====

export type QueueHealth = {
  configured: boolean;
  sent_24h: number;
  total_24h: number;
  success_rate_24h: number; // 0..1
  pending: number;
  failed: number;
  dead: number;
};

export async function getQueueHealth(): Promise<QueueHealth> {
  const supabase = getSupabaseAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const configured = Boolean(process.env.MULLERBOT_WEBHOOK_URL && process.env.MULLERBOT_API_KEY);

  // count exato via head:true — retorna o total real sem trafegar linhas. Antes os
  // totais vinham de data.length, que o PostgREST capa em 1000 linhas, saturando os
  // números e distorcendo o success_rate quando a tabela passa de ~1000 no escopo.
  const tbl = () => supabase.from('webhook_retry_queue');
  const [total24, sent24, pendingC, failedC, deadC] = await Promise.all([
    tbl().select('*', { count: 'exact', head: true }).gte('created_at', since),
    tbl().select('*', { count: 'exact', head: true }).gte('created_at', since).eq('status', 'sent'),
    tbl().select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    tbl().select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    tbl().select('*', { count: 'exact', head: true }).eq('status', 'dead'),
  ]);

  const total_24h = total24.count ?? 0;
  const sent_24h = sent24.count ?? 0;
  const success_rate_24h = total_24h > 0 ? sent_24h / total_24h : 0;
  const pending = pendingC.count ?? 0;
  const failed = failedC.count ?? 0;
  const dead = deadC.count ?? 0;

  return { configured, sent_24h, total_24h, success_rate_24h, pending, failed, dead };
}
