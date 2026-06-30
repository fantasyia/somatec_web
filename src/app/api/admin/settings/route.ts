import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from '@/lib/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import type { Json } from '@/types/database';

// Validadores por-key para valores que precisam de formato estrito (defesa contra
// XSS armazenado quando o valor é interpolado em HTML/script). Keys ausentes = livre.
const SETTING_VALIDATORS: Record<string, (v: unknown) => boolean> = {
  seo_google_analytics_id: (v) =>
    v == null ||
    v === '' ||
    (typeof v === 'string' && /^(G-[A-Z0-9]+|UA-\d+-\d+|GTM-[A-Z0-9]+)$/.test(v)),
};

export async function PUT(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const body = (await request.json()) as { key: string; value: Json };
  if (!body.key) {
    return NextResponse.json({ ok: false, message: 'Chave obrigatória.' }, { status: 400 });
  }

  const validator = SETTING_VALIDATORS[body.key];
  if (validator && !validator(body.value)) {
    return NextResponse.json({ ok: false, message: 'Valor inválido para esta configuração.' }, { status: 400 });
  }

  const db = getSupabaseAdminClient();
  const { error } = await db
    .from('site_settings')
    .upsert({ key: body.key, value: body.value }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const meta = getRequestMeta(request);
  await logActivity({
    userId: user.id,
    userEmail: user.email,
    action: 'update',
    tableName: 'site_settings',
    recordLabel: body.key,
    changes: { value: body.value } as Json,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  revalidateTag('site_settings');
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
