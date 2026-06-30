import { NextResponse, type NextRequest } from 'next/server';
import { createLogger } from '@/lib/logger';
import { incrementCounter } from '@/lib/metrics/registry';
import { apiVersionHeaders } from '@/lib/http/headers';

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
  // Label apenas com directive (baixa cardinalidade), não blockedUri (alta cardinalidade)
  incrementCounter('msm_csp_violations_total', { directive: parsed.directive });

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
