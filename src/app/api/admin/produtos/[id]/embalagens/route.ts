import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { revalidateTag } from '@/lib/cache';
import { createLogger } from '@/lib/logger';
import { apiVersionHeaders } from '@/lib/http/headers';

const log = createLogger('admin-product-packaging');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const packagingSchema = z.object({
  label: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  weight_or_volume: z.string().max(50).nullable().optional(),
  weight_grams: z.number().int().nonnegative().nullable().optional(),
  units_per_box: z.string().max(50).nullable().optional(),
  is_primary: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: productId } = await ctx.params;
  const db = getSupabaseAdminClient();
  const { data, error } = await db
    .from('product_packaging_options')
    .select('id, label, description, weight_or_volume, weight_grams, units_per_box, is_primary, active, display_order')
    .eq('product_id', productId)
    .order('display_order')
    .order('created_at');
  if (error) {
    log.warn('list failed', { productId }, error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
  }
  return NextResponse.json({ ok: true, items: data ?? [] }, { headers: apiVersionHeaders() });
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: productId } = await ctx.params;

  const raw = (await request.json().catch(() => null)) as unknown;
  const parsed = packagingSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, message: `${issue?.path.join('.') ?? 'body'}: ${issue?.message ?? 'inválido'}` },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  const db = getSupabaseAdminClient();
  const { data: product } = await db.from('products').select('id, name').eq('id', productId).maybeSingle();
  if (!product) {
    return NextResponse.json({ ok: false, message: 'Produto não encontrado.' }, { status: 404, headers: apiVersionHeaders() });
  }

  // próximo display_order
  const { data: maxRow } = await db
    .from('product_packaging_options')
    .select('display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.display_order ?? -1) + 1;

  const { data: row, error } = await db
    .from('product_packaging_options')
    .insert({
      product_id: productId,
      label: parsed.data.label,
      description: parsed.data.description ?? null,
      weight_or_volume: parsed.data.weight_or_volume ?? null,
      weight_grams: parsed.data.weight_grams ?? null,
      units_per_box: parsed.data.units_per_box ?? null,
      is_primary: parsed.data.is_primary ?? false,
      active: parsed.data.active ?? true,
      display_order: nextOrder,
    })
    .select('id, label, description, weight_or_volume, weight_grams, units_per_box, is_primary, active, display_order')
    .single();

  if (error || !row) {
    return NextResponse.json({ ok: false, message: error?.message ?? 'Falha ao inserir.' }, { status: 500, headers: apiVersionHeaders() });
  }

  try {
    const meta = getRequestMeta(request);
    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'create',
      tableName: 'product_packaging_options',
      recordId: row.id,
      recordLabel: `${product.name} — ${row.label}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (e) {
    log.warn('logActivity failed', undefined, e);
  }

  revalidateTag('products');
  return NextResponse.json({ ok: true, item: row }, { headers: apiVersionHeaders() });
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: productId } = await ctx.params;

  const raw = (await request.json().catch(() => null)) as { id?: string } & Record<string, unknown> | null;
  if (!raw?.id) {
    return NextResponse.json({ ok: false, message: 'id obrigatório.' }, { status: 400, headers: apiVersionHeaders() });
  }
  const parsed = packagingSchema.partial().safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, message: `${issue?.path.join('.') ?? 'body'}: ${issue?.message ?? 'inválido'}` },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  const db = getSupabaseAdminClient();
  const { data: row, error } = await db
    .from('product_packaging_options')
    .update(parsed.data)
    .eq('id', raw.id)
    .eq('product_id', productId)
    .select('id, label, description, weight_or_volume, weight_grams, units_per_box, is_primary, active, display_order')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
  }
  if (!row) {
    return NextResponse.json({ ok: false, message: 'Embalagem não encontrada.' }, { status: 404, headers: apiVersionHeaders() });
  }

  revalidateTag('products');
  return NextResponse.json({ ok: true, item: row }, { headers: apiVersionHeaders() });
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: productId } = await ctx.params;
  const optionId = new URL(request.url).searchParams.get('option_id');
  if (!optionId) {
    return NextResponse.json({ ok: false, message: 'option_id obrigatório.' }, { status: 400, headers: apiVersionHeaders() });
  }

  const db = getSupabaseAdminClient();
  const { error } = await db
    .from('product_packaging_options')
    .delete()
    .eq('id', optionId)
    .eq('product_id', productId);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
  }

  try {
    const meta = getRequestMeta(request);
    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'delete',
      tableName: 'product_packaging_options',
      recordId: optionId,
      recordLabel: 'embalagem',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (e) {
    log.warn('logActivity failed', undefined, e);
  }

  revalidateTag('products');
  return NextResponse.json({ ok: true }, { headers: apiVersionHeaders() });
}
