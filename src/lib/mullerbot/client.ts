import 'server-only';
import { withTiming } from '@/lib/perf/timing';
import { signBody } from './signing';
import type { MullerBotPayload } from './payload';

const TIMEOUT_MS = 8000;

export type SendOutcome =
  | { result: 'sent'; status: number; externalId?: string | null }
  | { result: 'client_error'; status: number; body: string } // 4xx — NÃO tentar retry
  | { result: 'server_error'; status: number; body: string } // 5xx — retry
  | { result: 'network_error'; message: string }              // retry
  | { result: 'not_configured' };                              // mantém na fila como pending

export async function sendToMullerBot(
  payload: MullerBotPayload,
  idempotencyKey: string,
): Promise<SendOutcome> {
  const url = process.env.MULLERBOT_WEBHOOK_URL;
  const apiKey = process.env.MULLERBOT_API_KEY;

  if (!url || !apiKey) {
    return { result: 'not_configured' };
  }

  const body = JSON.stringify(payload);
  const signature = signBody(body);

  return withTiming('mullerbot:send', async () => {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Source': 'msm-site',
        'X-Idempotency-Key': idempotencyKey,
        'X-Timestamp': new Date().toISOString(),
      };
      if (signature) headers['X-MSM-Signature'] = signature;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      const text = await res.text().catch(() => '');

      if (res.status >= 200 && res.status < 300) {
        // Sucesso. Pode haver { received, external_id }
        let externalId: string | null = null;
        try {
          const j = JSON.parse(text);
          if (typeof j?.external_id === 'string') externalId = j.external_id;
        } catch {
          // ignore parse error
        }
        return { result: 'sent', status: res.status, externalId };
      }

      if (res.status >= 400 && res.status < 500) {
        return { result: 'client_error', status: res.status, body: text.slice(0, 500) };
      }

      return { result: 'server_error', status: res.status, body: text.slice(0, 500) };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { result: 'network_error', message };
    }
  });
}
