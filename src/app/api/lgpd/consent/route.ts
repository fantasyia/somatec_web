import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getLgpdConsentText } from '@/lib/lgpd';
import { createLogger } from '@/lib/logger';
import { checkIdempotency, storeResponse, isValidIdempotencyKey } from '@/lib/idempotency';
import { apiVersionHeaders } from '@/lib/http/headers';
import { getClientIp as clientIpFromHeaders } from '@/lib/http/client-ip';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const log = createLogger('lgpd-consent');

type CookieConsentPayload = {
  event_type: 'cookie_consent';
  accepted: boolean;
  timestamp: string;
  ip: string;
  user_agent: string | null;
  text_version: string;
  text_hash: string;
};

function hasValidSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.startsWith('https://') && url.includes('.supabase.');
}

/**
 * Grava a prova de consentimento na tabela `lgpd_consent` (fonte durável).
 * É a metade OBRIGATÓRIA: se isto falhar, o consentimento não ficou registrado
 * e a rota tem que devolver erro — nunca `ok: true` sem prova, que era o bug.
 */
async function gravarConsentimento(p: CookieConsentPayload): Promise<void> {
  const db = getSupabaseAdminClient();
  const { error } = await db.from('lgpd_consent').insert({
    accepted: p.accepted,
    ip: p.ip,
    user_agent: p.user_agent,
    text_version: p.text_version,
    text_hash: p.text_hash,
    origem: 'cookie_banner',
  });
  if (error) throw new Error(`lgpd_consent insert falhou: ${error.message}`);
}

/**
 * Espelho no Betinna (CRM) — metade BEST-EFFORT. Só sai se
 * `BETINNA_CONSENT_URL` existir: essa env ainda não está no Railway porque o
 * endpoint de consentimento é da sessão do Betinna (ver card de dev). Não
 * mando pro BETINNA_LEADS_URL: consentimento de cookie não é lead e sujaria o
 * funil. Falhar aqui NUNCA derruba a rota — o registro durável é o Supabase.
 */
function espelharNoBetinna(p: CookieConsentPayload): void {
  const url = process.env.BETINNA_CONSENT_URL;
  const apiKey = process.env.BETINNA_API_KEY;
  if (!url || !apiKey) return;
  fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Source': 'somatec-site',
    },
    body: JSON.stringify(p),
    signal: AbortSignal.timeout(5000),
  }).catch((err: unknown) => {
    log.warn('espelho de consentimento no Betinna falhou (best-effort)', undefined, err);
  });
}

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
    user_agent: req.headers.get('user-agent'),
    text_version: version,
    text_hash: createHash('sha256').update(text, 'utf8').digest('hex'),
  };

  // Sem banco configurado (build/CI) não há onde provar o consentimento —
  // melhor recusar do que fingir que gravou. E era esse o bug: responder
  // `ok: true` sem gravar em lugar nenhum.
  if (!hasValidSupabaseConfig()) {
    return NextResponse.json(
      { error: 'consent store indisponível' },
      { status: 503, headers: apiVersionHeaders() },
    );
  }

  try {
    await gravarConsentimento(payload); // metade obrigatória (Supabase)
  } catch (err) {
    log.error('não gravei o consentimento LGPD', undefined, err);
    return NextResponse.json(
      { error: 'não foi possível registrar o consentimento' },
      { status: 503, headers: { 'Retry-After': '5', ...apiVersionHeaders() } },
    );
  }

  espelharNoBetinna(payload); // metade best-effort (CRM), não bloqueia

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
