import { NextResponse, type NextRequest } from 'next/server';
import { verifySignature } from '@/lib/mullerbot/signing';
import { callbackPayloadSchema, ingestCallback } from '@/lib/mullerbot/callbacks';
import { trackRequest, incrementCounter } from '@/lib/metrics/registry';
import { createLogger } from '@/lib/logger';
import { apiVersionHeaders } from '@/lib/http/headers';
import { getClientIp } from '@/lib/http/client-ip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/webhooks/mullerbot';
const log = createLogger('webhook-receiver');

/**
 * POST /api/webhooks/mullerbot
 *
 * Receiver de callbacks do MullerBot — quando um lead muda de status no CRM,
 * MullerBot avisa o site via este endpoint.
 *
 * Auth: HMAC-SHA256 via header `X-MSM-Signature: sha256=<hex>` sobre o body raw,
 * usando o mesmo `MULLERBOT_SIGNING_SECRET` que enviamos. Em produção sem secret
 * configurado, retorna 500 (config faltando, não falha aberta).
 *
 * Idempotência: payload.idempotency_key é UNIQUE no banco. Duplicatas retornam
 * 200 (operação already-done) sem inserir.
 *
 * Body esperado (JSON):
 * {
 *   "event_type": "lead_received|lead_responded|delivery_failed|...",
 *   "idempotency_key": "<unique key, 8-128 chars alfanuméricos>",
 *   "timestamp": "<ISO 8601 opcional>",
 *   "data": { ... }  // opcional
 * }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.MULLERBOT_SIGNING_SECRET;
  if (!secret) {
    log.warn('MULLERBOT_SIGNING_SECRET ausente — rejeitando callback');
    trackRequest(ROUTE, 500);
    return NextResponse.json(
      { ok: false, error: 'signing_secret_not_configured' },
      { status: 500, headers: apiVersionHeaders() },
    );
  }

  // Precisa ler body raw para verificar HMAC ANTES de parse JSON.
  const rawBody = await request.text();
  const signature = request.headers.get('x-msm-signature') ?? '';
  const signatureOk = verifySignature(rawBody, signature, secret);
  incrementCounter('msm_webhook_callbacks_total', {
    signature: signatureOk ? 'valid' : 'invalid',
  });

  if (!signatureOk) {
    log.warn('invalid HMAC signature on callback', {
      ip: getClientIp(request.headers),
      hasHeader: signature.length > 0,
    });
    trackRequest(ROUTE, 401);
    return NextResponse.json(
      { ok: false, error: 'invalid_signature' },
      { status: 401, headers: apiVersionHeaders() },
    );
  }

  // Parse + validate
  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    trackRequest(ROUTE, 400);
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: apiVersionHeaders() },
    );
  }
  const parsed = callbackPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join('.') ?? 'body';
    trackRequest(ROUTE, 400);
    return NextResponse.json(
      { ok: false, error: `validation: ${path}: ${issue?.message ?? 'inválido'}` },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  const sourceIp = getClientIp(request.headers);
  const result = await ingestCallback(parsed.data, signatureOk, sourceIp);

  // Métrica por outcome (inserted/duplicate/error)
  incrementCounter('msm_webhook_callbacks_ingest_total', {
    event_type: parsed.data.event_type,
    outcome: result.mode,
  });

  if (result.mode === 'error') {
    trackRequest(ROUTE, 500);
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500, headers: apiVersionHeaders() },
    );
  }

  // Duplicate é tratado como sucesso (idempotência)
  trackRequest(ROUTE, 200);
  return NextResponse.json(
    {
      ok: true,
      mode: result.mode,
      ...(result.mode === 'inserted' ? { id: result.id } : {}),
    },
    { status: 200, headers: apiVersionHeaders() },
  );
}
