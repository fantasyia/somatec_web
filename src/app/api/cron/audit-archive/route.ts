import { NextResponse, type NextRequest } from 'next/server';
import { archiveExpired, countExpired } from '@/lib/admin/audit-archive';
import { validateBearer } from '@/lib/auth/bearer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron job: arquiva registros de admin_activity_log > AUDIT_RETENTION_DAYS (default 90).
 * Recomendado: 1x por dia (3:30 UTC, fora de horário de pico).
 *
 * Auth: Bearer CRON_SECRET (mesmo padrão dos outros crons).
 *
 * Query params:
 *   ?dry-run=true → conta quantos seriam apagados, sem deletar.
 */
export async function GET(req: NextRequest) {
  const check = validateBearer(req.headers.get('authorization'), 'CRON_SECRET', { requireInProduction: true });
  if (!check.ok) {
    if (check.reason === 'missing_secret') {
      return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry-run') === 'true';

  if (dryRun) {
    const expired = await countExpired();
    return NextResponse.json({
      ok: true,
      dry_run: true,
      would_delete: expired,
      retention_days: Number(process.env.AUDIT_RETENTION_DAYS ?? 90),
    });
  }

  const result = await archiveExpired();
  return NextResponse.json({ ok: true, ...result });
}
