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

/** Trunca respeitando o `max` do Zod do Betinna (valor acima do limite = 400). */
function cut(v: string | null | undefined, max: number): string | undefined {
  const s = v?.trim();
  return s ? s.slice(0, max) : undefined;
}

/** Mapeia o payload interno para o contrato ESTRUTURADO do Betinna
 *  (POST /public/leads): empresa, cidade/uf, segmento, região/experiência,
 *  paginaOrigem, consentimentoLgpd e metadados viram CAMPOS — aparecem na
 *  seção "Dados da captura" do lead no CRM. Só o que não tem campo
 *  correspondente (volume estimado, etc.) vai para `mensagem`. */
function buildBody(p: MullerBotPayload) {
  // Campos estruturados por tipo de formulário (region/experience = representante,
  // segment = b2b). O restante dos extra_fields fica como contexto na mensagem.
  const { region, experience, segment, ...outrosExtras } = p.extra_fields;

  const ctx: string[] = [];
  if (p.interest_type) ctx.push(`Interesse: ${p.interest_type}`);
  ctx.push(`Formulário: ${p.form_type}`);
  for (const [k, v] of Object.entries(outrosExtras)) {
    if (v) ctx.push(`${k}: ${v}`);
  }
  if (p.captcha_unverified) ctx.push('⚠ captcha não verificado');

  const mensagem = cut(
    [p.message ?? '', ctx.length ? `— ${ctx.join(' · ')}` : ''].filter(Boolean).join('\n\n'),
    2000,
  );

  // uf: o Betinna exige exatamente 2 letras — fora disso, omite (evita 400).
  const uf = p.state && /^[A-Za-z]{2}$/.test(p.state) ? p.state.toUpperCase() : undefined;

  // Roteamento por funil: formulário de representante → "Prospecção Reps";
  // qualquer outro lead (cliente/b2b, ads, redes, contato) → "Clientes".
  // IDs vêm de env; se ausentes, o Betinna usa o funil padrão dele.
  const isRep = p.interest_type === 'representante';
  const funilId = isRep
    ? process.env.BETINNA_FUNIL_REPS
    : process.env.BETINNA_FUNIL_CLIENTES;

  return {
    nome: cut(p.name, 200),
    telefone: cut(p.whatsapp, 30),
    email: cut(p.email, 200),
    empresa: cut(p.company, 200),
    cidade: cut(p.city, 100),
    ...(uf ? { uf } : {}),
    segmento: cut(segment, 60),
    regiao: cut(region, 150),
    experiencia: cut(experience, 1000),
    mensagem,
    origem: 'site-institucional',
    paginaOrigem: cut(p.source_page, 300),
    consentimentoLgpd: {
      aceito: p.lgpd_consent.accepted,
      timestamp: cut(p.lgpd_consent.timestamp, 60),
      versaoTexto: cut(p.lgpd_consent.text_version, 60),
      hashTexto: cut(p.lgpd_consent.text_hash, 200),
    },
    metadados: {
      userAgent: cut(p.site_metadata.user_agent, 500),
      referer: cut(p.site_metadata.referer, 500),
    },
    ...(funilId ? { funilId } : {}),
    // Atribuição de marketing (contrato fechado com o dev do Betinna). O site
    // manda o valor CRU; o backend normaliza/sanitiza. origemCadastro sempre;
    // formulario quando o form informa; atribuicao só quando há UTM (omite senão).
    origemCadastro: 'site',
    ...(p.formulario ? { formulario: p.formulario } : {}),
    ...(p.atribuicao ? { atribuicao: p.atribuicao } : {}),
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
          // charset explícito: garante UTF-8 na ponta (acentos íntegros no CRM)
          'Content-Type': 'application/json; charset=utf-8',
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
