import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getLgpdConsentText } from '@/lib/lgpd';
import { createLogger } from '@/lib/logger';
import { checkIdempotency, storeResponse, isValidIdempotencyKey } from '@/lib/idempotency';
import { apiVersionHeaders } from '@/lib/http/headers';
import { getClientIp as clientIpFromHeaders } from '@/lib/http/client-ip';

const log = createLogger('lgpd-consent');

type CookieConsentPayload = {
  event_type: 'cookie_consent';
  accepted: boolean;
  timestamp: string;
  ip: string;
  text_version: string;
  text_hash: string;
};

function getClientIp(req: NextRequest): string {
  return clientIpFromHeaders(req.headers);
}

export async function POST(req: NextRequest) {
  // Idempotency: dedup de consent banner spam (acidental refresh, double click)
  const idempotencyHeader = req.headers.get('idempotency-key');
  if (idempotencyHeader && !isValidIdempotencyKey(idempotencyHeader)) {
    return NextResponse.json({ error: 'invalid idempotency-key' }, { status: 400, headers: apiVersionHeaders() });
  }
  if (idempotencyHeader) {
    const idem = await checkIdempotency(idempotencyHeader);
    if (idem.mode === 'replay') {
      return new NextResponse(idem.response.body, {
        status: idem.response.status,
        headers: {
          'Content-Type': idem.response.contentType,
          'X-Idempotent-Replay': 'true',
          ...apiVersionHeaders(),
        },
      });
    }
  }

  let accepted: boolean;
  try {
    const body = await req.json();
    if (typeof body?.accepted !== 'boolean') {
      return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: apiVersionHeaders() });
    }
    accepted = body.accepted as boolean;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400, headers: apiVersionHeaders() });
  }

  const { version, text } = await getLgpdConsentText();
  const payload: CookieConsentPayload = {
    event_type: 'cookie_consent',
    accepted,
    timestamp: new Date().toISOString(),
    ip: getClientIp(req),
    text_version: version,
    text_hash: createHash('sha256').update(text, 'utf8').digest('hex'),
  };

  const url = process.env.MULLERBOT_WEBHOOK_URL;
  const apiKey = process.env.MULLERBOT_API_KEY;

  if (url && apiKey) {
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Source': 'msm-site',
        'X-Timestamp': payload.timestamp,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }).catch((err: unknown) => {
      log.warn('consent webhook failed (fire-and-forget)', undefined, err);
    });
  }

  const successBody = JSON.stringify({ ok: true });
  if (idempotencyHeader) {
    await storeResponse(idempotencyHeader, {
      status: 200,
      body: successBody,
      contentType: 'application/json',
    });
  }
  return new NextResponse(successBody, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...apiVersionHeaders() },
  });
}
