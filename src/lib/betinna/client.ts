import 'server-only';
import { withTiming } from '@/lib/perf/timing';
import type { MullerBotPayload } from '@/lib/mullerbot/payload';
import type { SendOutcome } from '@/lib/mullerbot/client';

/**
 * Cliente do Betinna.ai — encaminha os leads dos formulários para o CRM.
 * POST {BETINNA_LEADS_URL} com header `x-api-key`. Endpoint público:
 *   /api/v1/public/leads  → { nome, telefone|email, mensagem?, origem? }
 *
 * Retorna o mesmo `SendOutcome` do MullerBot para reaproveitar a fila/retry
 * (enqueueSubmission → markSent/markAttempt → computeAttempt).
 */

const TIMEOUT_MS = 8000;

/** Mapeia o payload interno (rico) para o formato enxuto do Betinna.
 *  Campos sem correspondência (interesse, empresa, local, segmento…) vão
 *  para `mensagem` como observações, para não perder nada no CRM. */
function buildBody(p: MullerBotPayload) {
  const ctx: string[] = [];
  if (p.interest_type) ctx.push(`Interesse: ${p.interest_type}`);
  if (p.company) ctx.push(`Empresa: ${p.company}`);
  const local = [p.city, p.state].filter(Boolean).join('/');
  if (local) ctx.push(`Local: ${local}`);
  for (const [k, v] of Object.entries(p.extra_fields)) {
    if (v) ctx.push(`${k}: ${v}`);
  }
  ctx.push(`Página: ${p.source_page}`);
  if (p.captcha_unverified) ctx.push('captcha não verificado');

  const mensagem =
    [p.message ?? '', ctx.length ? `— ${ctx.join(' · ')}` : ''].filter(Boolean).join('\n\n') ||
    undefined;

  // Roteamento por funil: formulário de representante → "Prospecção Reps";
  // qualquer outro lead (cliente/b2b, ads, redes, contato) → "Clientes".
  // IDs vêm de env; se ausentes, o Betinna usa o funil padrão dele.
  const isRep = p.interest_type === 'representante';
  const funilId = isRep
    ? process.env.BETINNA_FUNIL_REPS
    : process.env.BETINNA_FUNIL_CLIENTES;

  return {
    nome: p.name,
    telefone: p.whatsapp || undefined,
    email: p.email || undefined,
    mensagem,
    origem: 'site-institucional',
    ...(funilId ? { funilId } : {}),
  };
}

export async function sendToBetinna(payload: MullerBotPayload): Promise<SendOutcome> {
  const url = process.env.BETINNA_LEADS_URL;
  const apiKey = process.env.BETINNA_API_KEY;
  if (!url || !apiKey) {
    return { result: 'not_configured' };
  }

  const body = JSON.stringify(buildBody(payload));

  return withTiming('betinna:send', async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body,
        signal: controller.signal,
      });

      if (res.ok) {
        let externalId: string | null = null;
        try {
          const j = (await res.json()) as { id?: string; leadId?: string; data?: { id?: string; leadId?: string } };
          externalId = j?.data?.leadId ?? j?.data?.id ?? j?.leadId ?? j?.id ?? null;
        } catch {
          // corpo não-JSON — ok, lead aceito mesmo assim
        }
        return { result: 'sent', status: res.status, externalId };
      }

      const text = await res.text().catch(() => '');
      // 4xx = erro do nosso lado (payload/chave) — NÃO retry.
      if (res.status >= 400 && res.status < 500) {
        return { result: 'client_error', status: res.status, body: text.slice(0, 500) };
      }
      // 5xx = Betinna indisponível — retry pela fila.
      return { result: 'server_error', status: res.status, body: text.slice(0, 500) };
    } catch (err) {
      return {
        result: 'network_error',
        message: err instanceof Error ? err.message : 'fetch failed',
      };
    } finally {
      clearTimeout(timer);
    }
  });
}
