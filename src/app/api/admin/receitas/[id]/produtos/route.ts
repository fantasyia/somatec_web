import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { revalidateTag } from '@/lib/cache';
import { createLogger } from '@/lib/logger';
import { apiVersionHeaders } from '@/lib/http/headers';

const log = createLogger('admin-recipe-products');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const linkSchema = z.object({ product_id: z.string().uuid() });

/** Lista produtos vinculados à receita. */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: recipeId } = await ctx.params;
  const db = getSupabaseAdminClient();
  const { data, error } = await db
    .from('recipe_products')
    .select('product_id, products!inner(id, name, slug, main_image_url)')
    .eq('recipe_id', recipeId);
  if (error) {
    log.warn('list failed', { recipeId }, error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
  }
  const items =
    (data as unknown as { product_id: string; products: { id: string; name: string; slug: string; main_image_url: string | null } }[] | null)?.map(
      (row) => ({
        product_id: row.product_id,
        name: row.products.name,
        slug: row.products.slug,
        main_image_url: row.products.main_image_url,
      }),
    ) ?? [];
  return NextResponse.json({ ok: true, items }, { headers: apiVersionHeaders() });
}

/** Vincula um produto à receita. */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: recipeId } = await ctx.params;
  const raw = (await request.json().catch(() => null)) as unknown;
  const parsed = linkSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'product_id inválido.' }, { status: 400, headers: apiVersionHeaders() });
  }

  const db = getSupabaseAdminClient();
  const { error } = await db
    .from('recipe_products')
    .insert({ recipe_id: recipeId, product_id: parsed.data.product_id });

  // duplicate? supabase devolve "duplicate key" — ignora
  if (error && !error.message.toLowerCase().includes('duplicate')) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
  }

  try {
    const meta = getRequestMeta(request);
    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'create',
      tableName: 'recipe_products',
      recordId: recipeId,
      recordLabel: `link product=${parsed.data.product_id}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (e) {
    log.warn('logActivity failed', undefined, e);
  }

  revalidateTag('recipes');
  return NextResponse.json({ ok: true }, { headers: apiVersionHeaders() });
}

/** Desvincula um produto da receita. */
export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: recipeId } = await ctx.params;
  const productId = new URL(request.url).searchParams.get('product_id');
  if (!productId) {
    return NextResponse.json({ ok: false, message: 'product_id obrigatório.' }, { status: 400, headers: apiVersionHeaders() });
  }

  const db = getSupabaseAdminClient();
  const { error } = await db
    .from('recipe_products')
    .delete()
    .eq('recipe_id', recipeId)
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
      tableName: 'recipe_products',
      recordId: recipeId,
      recordLabel: `unlink product=${productId}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (e) {
    log.warn('logActivity failed', undefined, e);
  }

  revalidateTag('recipes');
  return NextResponse.json({ ok: true }, { headers: apiVersionHeaders() });
}
