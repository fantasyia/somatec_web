import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { formSubmitSchema } from '@/lib/forms/schemas';
import { verifyTurnstile } from '@/lib/turnstile/verify';
import { limitFormSubmit } from '@/lib/ratelimit/upstash';
import { rateLimitHeaders } from '@/lib/ratelimit/headers';
import { checkIdempotency, storeResponse, isValidIdempotencyKey } from '@/lib/idempotency';
import { trackRequest } from '@/lib/metrics/registry';
import { apiVersionHeaders } from '@/lib/http/headers';
import { getClientIp as clientIpFromHeaders } from '@/lib/http/client-ip';

const ROUTE = '/api/forms/submit';
import { buildMullerBotPayload } from '@/lib/mullerbot/payload';
import { sendToBetinna } from '@/lib/betinna/client';
import {
  enqueueSubmission,
  markSent,
  markAttempt,
} from '@/lib/webhook-queue';
import { getLgpdConsentText } from '@/lib/lgpd';
import { createLogger } from '@/lib/logger';

const log = createLogger('forms');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  return clientIpFromHeaders(req.headers);
}

const SUCCESS = {
  ok: true as const,
  message: 'Mensagem enviada com sucesso. Nossa equipe entrará em contato pelo WhatsApp.',
};

function reject(message: string, status = 400) {
  trackRequest(ROUTE, status);
  return NextResponse.json({ ok: false, message }, { status, headers: apiVersionHeaders() });
}

export async function POST(req: NextRequest) {
  // Idempotency-Key: cliente pode mandar chave para deduplicar retries.
  // Se ausente, ignora. Se inválida, rejeita.
  const idempotencyHeader = req.headers.get('idempotency-key');
  if (idempotencyHeader && !isValidIdempotencyKey(idempotencyHeader)) {
    return reject('Idempotency-Key inválida (8-128 chars alfanuméricos).');
  }
  if (idempotencyHeader) {
    const idem = await checkIdempotency(idempotencyHeader);
    if (idem.mode === 'replay') {
      log.info('idempotent replay', { key: idempotencyHeader });
      return new NextResponse(idem.response.body, {
        status: idem.response.status,
        headers: {
          'Content-Type': idem.response.contentType,
          'X-Idempotent-Replay': 'true',
          ...apiVersionHeaders(),
        },
      });
    }
    if (idem.mode === 'in_flight') {
      // Outra requisição com a mesma chave ainda está processando — não duplica o lead.
      return reject('Sua mensagem já está sendo processada. Aguarde alguns instantes.', 409);
    }
  }

  // Parse JSON
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return reject('Requisição inválida.');
  }

  // Honeypot — bots preenchem "website". Descartar silenciosamente com sucesso fake
  // (não dar pista para o bot ajustar payload). Resposta 200 + sucesso aparente.
  if (
    raw &&
    typeof raw === 'object' &&
    'website' in raw &&
    typeof (raw as Record<string, unknown>).website === 'string' &&
    ((raw as Record<string, string>).website ?? '').trim().length > 0
  ) {
    log.warn('honeypot triggered', {
      ip: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? 'unknown',
      referer: req.headers.get('referer') ?? null,
      websiteValue: ((raw as Record<string, string>).website ?? '').slice(0, 200),
    });
    trackRequest(ROUTE, 200);
    return NextResponse.json(SUCCESS, { status: 200, headers: apiVersionHeaders() });
  }

  // Turnstile — valida ANTES do Zod (adendo v1.1 §5.3)
  const tokenCandidate =
    raw && typeof raw === 'object'
      ? ((raw as Record<string, unknown>).captcha_token as string | undefined)
      : undefined;
  const ip = getClientIp(req);
  const tsOutcome = await verifyTurnstile(tokenCandidate, ip);
  // Fail-open controlado: se NÃO deu pra VERIFICAR por falha de infra (Cloudflare
  // lenta/fora — não é culpa do usuário), aceita o lead mas marca captcha_unverified
  // pra triagem no CRM. Token comprovadamente inválido (ou secret ausente em prod)
  // continua bloqueado (400). Honeypot + rate-limit seguem valendo.
  let captchaUnverified = false;
  if (!tsOutcome.ok) {
    if (tsOutcome.infraFailure) {
      captchaUnverified = true;
      log.warn('turnstile infra failure — aceitando lead com captcha_unverified', {
        reason: tsOutcome.reason,
        ip,
      });
    } else {
      return reject(
        'Validação de segurança falhou. Recarregue a página e tente novamente.',
        400,
      );
    }
  }

  // Rate limit (v1.1 §6)
  const rl = await limitFormSubmit(ip);
  if (!rl.allowed) {
    trackRequest(ROUTE, 429);
    return NextResponse.json(
      { ok: false, message: 'Muitas tentativas. Aguarde um momento e tente novamente.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), ...apiVersionHeaders() } },
    );
  }

  // Zod
  const parsed = formSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstError =
      Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0] ?? 'Dados inválidos.';
    return reject(firstError);
  }

  // Construção do payload
  const lgpd = await getLgpdConsentText();
  const payload = buildMullerBotPayload({
    validated: parsed.data,
    ip,
    userAgent: req.headers.get('user-agent') ?? 'unknown',
    referer: req.headers.get('referer'),
    lgpdTextVersion: lgpd.version,
    lgpdTextRaw: lgpd.text,
    captchaUnverified,
  });

  const idempotencyKey = randomUUID();

  // Enfileira (registro técnico de transporte — NÃO é lead)
  try {
    await enqueueSubmission({
      idempotencyKey,
      payload,
      sourcePage: parsed.data.source_page ?? null,
      sourceIp: ip,
    });
  } catch (err) {
    log.error('enqueue error', undefined, err);
    trackRequest(ROUTE, 500);
    return NextResponse.json(
      {
        ok: false,
        message: 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.',
      },
      { status: 500, headers: apiVersionHeaders() },
    );
  }

  // Tentativa síncrona imediata (encaminha o lead ao Betinna.ai)
  const sendResult = await sendToBetinna(payload);

  if (sendResult.result === 'sent') {
    await markSent(idempotencyKey, sendResult.status, sendResult.externalId ?? null);
  } else {
    await markAttempt(idempotencyKey, sendResult, 0);
  }

  // Sempre responde sucesso quando submissão é válida (v1.1 §2.2 + §18)
  const successBody = JSON.stringify(SUCCESS);
  if (idempotencyHeader) {
    await storeResponse(idempotencyHeader, {
      status: 200,
      body: successBody,
      contentType: 'application/json',
    });
  }
  trackRequest(ROUTE, 200);
  return new NextResponse(successBody, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...apiVersionHeaders() },
  });
}
