import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { auditQuerySchema, queryAuditTrail, toCsv } from '@/lib/admin/audit-query';
import { trackRequest } from '@/lib/metrics/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/admin/audit-trail';

/**
 * GET /api/admin/audit-trail
 *
 * Auth: requireAdmin (session cookie + admin_profiles).
 *
 * Query params (todos opcionais):
 *   from         ISO datetime — lower bound created_at
 *   to           ISO datetime — upper bound created_at
 *   user_email   filtra por email do usuário
 *   user_id      filtra por UUID do usuário
 *   action       create/update/delete/admin_login/upload/etc
 *   table_name   nome da tabela alvo (solutions, products, etc)
 *   record_id    UUID do registro alvo
 *   limit        1-1000 (default 100)
 *   offset       paginação (default 0)
 *   format       'json' (default) | 'csv'
 *
 * Returns: JSON com { rows, count, has_more, query } ou CSV puro.
 */
export async function GET(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    trackRequest(ROUTE, 401);
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  const parsed = auditQuerySchema.safeParse(params);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join('.') ?? 'query';
    const msg = `${path}: ${firstIssue?.message ?? 'inválido'}`;
    trackRequest(ROUTE, 400);
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }

  const result = await queryAuditTrail(parsed.data);
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase();

  trackRequest(ROUTE, 200);

  if (format === 'csv') {
    const filename = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(toCsv(result.rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    rows: result.rows,
    count: result.count,
    has_more: result.has_more,
    query: result.query,
  });
}
