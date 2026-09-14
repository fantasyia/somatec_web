import { NextResponse, type NextRequest } from 'next/server';
import { createLogger } from '@/lib/logger';
import { incrementCounter } from '@/lib/metrics/registry';
import { apiVersionHeaders } from '@/lib/http/headers';
import { limitCspReport } from '@/lib/ratelimit/upstash';
import { getClientIp } from '@/lib/http/client-ip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = createLogger('csp-report');

// Formato CSP Level 2 (application/csp-report) e Level 3 (application/reports+json)
// Aceita ambos; extrai os campos comuns.
type CspReportL2 = {
  'csp-report'?: {
    'document-uri'?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'blocked-uri'?: string;
    'source-file'?: string;
    'line-number'?: number;
    'script-sample'?: string;
  };
};

type CspReportL3 = Array<{
  type?: string;
  body?: {
    documentURL?: string;
    effectiveDirective?: string;
    blockedURL?: string;
    sourceFile?: string;
    lineNumber?: number;
    sample?: string;
  };
}>;

/** Vocabulário FECHADO de diretivas de CSP (nível 2/3), pra o label da métrica
 *  não ser texto livre vindo do corpo da requisição. Qualquer coisa fora
 *  daqui vira `outra` — mantém o alerta útil e a cardinalidade finita. */
const DIRETIVAS_CONHECIDAS = new Set([
  'base-uri', 'child-src', 'connect-src', 'default-src', 'font-src',
  'form-action', 'frame-ancestors', 'frame-src', 'img-src', 'manifest-src',
  'media-src', 'object-src', 'report-to', 'report-uri', 'sandbox',
  'script-src', 'script-src-attr', 'script-src-elem', 'style-src',
  'style-src-attr', 'style-src-elem', 'upgrade-insecure-requests',
  'worker-src', 'unknown',
]);

function rotuloDeDiretiva(bruto: string): string {
  // O navegador manda "script-src-elem" ou, em alguns casos, a diretiva com o
  // valor junto ("script-src 'self'") — só o primeiro token interessa.
  const token = String(bruto ?? '').trim().toLowerCase().split(/[\s;]/)[0];
  return DIRETIVAS_CONHECIDAS.has(token) ? token : 'outra';
}

function normalize(payload: unknown): {
  documentUri: string;
  directive: string;
  blockedUri: string;
  sourceFile?: string;
  lineNumber?: number;
  sample?: string;
} | null {
  // Level 2 single report
  if (payload && typeof payload === 'object' && 'csp-report' in payload) {
    const r = (payload as CspReportL2)['csp-report'];
    if (!r) return null;
    return {
      documentUri: r['document-uri'] ?? 'unknown',
      directive: r['effective-directive'] ?? r['violated-directive'] ?? 'unknown',
      blockedUri: r['blocked-uri'] ?? 'unknown',
      sourceFile: r['source-file'],
      lineNumber: r['line-number'],
      sample: r['script-sample'],
    };
  }
  // Level 3 batch (Reporting API). Pegamos o primeiro.
  if (Array.isArray(payload)) {
    const first = (payload as CspReportL3)[0];
    if (!first?.body) return null;
    return {
      documentUri: first.body.documentURL ?? 'unknown',
      directive: first.body.effectiveDirective ?? 'unknown',
      blockedUri: first.body.blockedURL ?? 'unknown',
      sourceFile: first.body.sourceFile,
      lineNumber: first.body.lineNumber,
      sample: first.body.sample,
    };
  }
  return null;
}

// Trunca strings longas para evitar log poluído / DoS
function truncate(v: string | undefined, max = 500): string | undefined {
  if (v === undefined) return undefined;
  return v.length > max ? v.slice(0, max) + '…' : v;
}

export async function POST(request: NextRequest) {
  // Teto por IP (M5 da auditoria): é endpoint público e sem autenticação, e o
  // corpo alimenta um contador em memória. Sem limite, um script POSTando em
  // loop enche o registro de métricas do worker.
  const limiteCsp = await limitCspReport(getClientIp(request.headers));
  if (!limiteCsp.allowed) {
    return new NextResponse(null, { status: 429, headers: apiVersionHeaders() });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: apiVersionHeaders() });
  }

  const parsed = normalize(raw);
  if (!parsed) {
    // 204 — não queremos que o browser tente reenviar
    return new NextResponse(null, { status: 204, headers: apiVersionHeaders() });
  }

  // Métrica para alerta (Grafana: rate(msm_csp_violations_total[5m]) > 0.5)
  //
  // 🔴 O LABEL PASSA POR ALLOWLIST (M5 da auditoria 13/09). Ele vinha do CORPO
  // da requisição, que qualquer um POSTa: 100 mil relatórios com
  // `effective-directive` aleatório faziam o mapa de contadores crescer sem
  // teto na memória do worker até o restart, e o /api/metrics passava a
  // devolver megabytes. Diretiva de CSP é vocabulário FECHADO — o que não
  // estiver nele vira `outra`, e a cardinalidade fica limitada ao tamanho
  // desta lista.
  incrementCounter('msm_csp_violations_total', { directive: rotuloDeDiretiva(parsed.directive) });

  log.warn('CSP violation', {
    documentUri: truncate(parsed.documentUri),
    directive: parsed.directive,
    blockedUri: truncate(parsed.blockedUri),
    sourceFile: truncate(parsed.sourceFile),
    lineNumber: parsed.lineNumber,
    sample: truncate(parsed.sample, 200),
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  // CSP spec recomenda 204 (no content)
  return new NextResponse(null, { status: 204 });
}
