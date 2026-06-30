import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { auditStatsQuerySchema, getAuditStats } from '@/lib/admin/audit-stats';
import { trackRequest } from '@/lib/metrics/registry';
import { apiVersionHeaders } from '@/lib/http/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/admin/audit-stats';

/**
 * GET /api/admin/audit-stats
 *
 * Auth: requireAdmin.
 *
 * Query params:
 *   from   ISO datetime (lower bound)
 *   to     ISO datetime (upper bound)
 *   top    1-50, default 10 — top-N por categoria
 *
 * Retorna agregações:
 *   total      — total de registros no range
 *   by_action  — top-N actions (create, update, delete, admin_login, etc)
 *   by_table   — top-N tabelas alvo
 *   by_user    — top-N usuários por email
 *   per_day    — série temporal YYYY-MM-DD → count
 */
export async function GET(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    trackRequest(ROUTE, 401);
    return NextResponse.json(
      { ok: false, message: 'Não autorizado.' },
      { status: 401, headers: apiVersionHeaders() },
    );
  }

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = auditStatsQuerySchema.safeParse(params);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join('.') ?? 'query';
    trackRequest(ROUTE, 400);
    return NextResponse.json(
      { ok: false, message: `${path}: ${issue?.message ?? 'inválido'}` },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  const stats = await getAuditStats(parsed.data);
  trackRequest(ROUTE, 200);
  return NextResponse.json(
    { ok: true, ...stats },
    { status: 200, headers: apiVersionHeaders() },
  );
}
