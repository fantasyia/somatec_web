import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag } from '@/lib/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { whatsAppButtonSchema } from '@/lib/whatsapp-button';
import { createLogger } from '@/lib/logger';
import { apiVersionHeaders } from '@/lib/http/headers';
import type { Json } from '@/types/database';

const log = createLogger('admin-whatsapp');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { ok: false, message: 'Não autorizado.' },
      { status: 401, headers: apiVersionHeaders() },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'JSON inválido.' },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  const parsed = whatsAppButtonSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join('.') ?? 'body';
    return NextResponse.json(
      { ok: false, message: `${path}: ${issue?.message ?? 'inválido'}` },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  const value = parsed.data;
  const db = getSupabaseAdminClient();
  const { error } = await db
    .from('site_settings')
    .upsert(
      { key: 'whatsapp_button', value: value as unknown as Json },
      { onConflict: 'key' },
    );

  if (error) {
    log.warn('upsert site_settings failed', { key: 'whatsapp_button' }, error);
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500, headers: apiVersionHeaders() },
    );
  }

  try {
    const meta = getRequestMeta(request);
    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'update',
      tableName: 'site_settings',
      recordLabel: 'whatsapp_button',
      changes: { enabled: value.enabled } as Json,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (e) {
    log.warn('logActivity failed', undefined, e);
  }

  // Invalida o unstable_cache do layout (tag declarada em whatsapp-button.ts)
  revalidateTag('whatsapp_button');

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: apiVersionHeaders() },
  );
}
