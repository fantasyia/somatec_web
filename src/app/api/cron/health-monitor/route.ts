import { NextResponse, type NextRequest } from 'next/server';
import { runHealthMonitor } from '@/lib/alerts/monitor';
import { validateBearer } from '@/lib/auth/bearer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron job: avalia thresholds de saúde + envia webhook se algo passa.
 * Recomendado a cada 5 minutos.
 *
 * Auth: mesma do process-webhook-queue (Bearer CRON_SECRET).
 * Em produção sem CRON_SECRET configurado, retorna 500.
 */
export async function GET(req: NextRequest) {
  const check = validateBearer(req.headers.get('authorization'), 'CRON_SECRET', { requireInProduction: true });
  if (!check.ok) {
    if (check.reason === 'missing_secret') {
      return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const result = await runHealthMonitor();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
