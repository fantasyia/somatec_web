import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import type { HomeHero } from '@/types/database';

type HeroInsert = Partial<Omit<HomeHero, 'id' | 'created_at' | 'updated_at'>>;

export async function POST(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });

  const body = await request.json() as HeroInsert;
  const db = getSupabaseAdminClient();
  const { data, error } = await db.from('home_hero').insert(body as never).select('id').single();
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  await logActivity({ userId: user.id, userEmail: user.email, action: 'create', tableName: 'home_hero', recordId: data.id, ...getRequestMeta(request) });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PUT(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });

  const { id, ...rest } = await request.json() as { id: string } & HeroInsert;
  const db = getSupabaseAdminClient();
  const { error } = await db.from('home_hero').update(rest as never).eq('id', id);
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  await logActivity({ userId: user.id, userEmail: user.email, action: 'update', tableName: 'home_hero', recordId: id, ...getRequestMeta(request) });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
