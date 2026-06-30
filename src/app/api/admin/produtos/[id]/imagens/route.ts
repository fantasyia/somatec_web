import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { revalidateTag } from '@/lib/cache';
import { createLogger } from '@/lib/logger';
import { apiVersionHeaders } from '@/lib/http/headers';

const log = createLogger('admin-product-images');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

type RouteContext = { params: Promise<{ id: string }> };

/** Lista todas as imagens de galeria de um produto, ordenadas. */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: productId } = await ctx.params;
  const db = getSupabaseAdminClient();
  const { data, error } = await db
    .from('product_images')
    .select('id, image_url, alt_text, display_order, active')
    .eq('product_id', productId)
    .order('display_order');
  if (error) {
    log.warn('list failed', { productId }, error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
  }
  return NextResponse.json({ ok: true, items: data ?? [] }, { headers: apiVersionHeaders() });
}

/** Upload de uma nova imagem para a galeria (form-data: file + alt_text). */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: productId } = await ctx.params;

  const db = getSupabaseAdminClient();
  const { data: product } = await db.from('products').select('id, name').eq('id', productId).maybeSingle();
  if (!product) {
    return NextResponse.json({ ok: false, message: 'Produto não encontrado.' }, { status: 404, headers: apiVersionHeaders() });
  }

  const fd = await request.formData();
  const file = fd.get('file') as File | null;
  const altText = (fd.get('alt_text') as string | null) ?? null;

  if (!file) {
    return NextResponse.json({ ok: false, message: 'Arquivo obrigatório.' }, { status: 400, headers: apiVersionHeaders() });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, message: 'Imagem muito grande (máx. 10MB).' }, { status: 400, headers: apiVersionHeaders() });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ ok: false, message: `Tipo de arquivo não permitido: ${file.type || 'desconhecido'}.` }, { status: 400, headers: apiVersionHeaders() });
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const path = `products/gallery/${productId}/${timestamp}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await db.storage
    .from('site-public')
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (uploadError) {
    log.warn('storage upload failed', { path, productId }, uploadError);
    return NextResponse.json({ ok: false, message: uploadError.message }, { status: 500, headers: apiVersionHeaders() });
  }

  const { data: { publicUrl } } = db.storage.from('site-public').getPublicUrl(path);

  // Próxima ordem = (max + 1) ou 0 se vazio
  const { data: maxRow } = await db
    .from('product_images')
    .select('display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.display_order ?? -1) + 1;

  const { data: row, error: insertError } = await db
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: publicUrl,
      alt_text: altText,
      display_order: nextOrder,
      active: true,
    })
    .select('id, image_url, alt_text, display_order, active')
    .single();

  if (insertError || !row) {
    log.warn('insert product_images failed', { productId, path }, insertError);
    await db.storage.from('site-public').remove([path]).catch(() => {});
    return NextResponse.json({ ok: false, message: insertError?.message ?? 'Falha ao inserir.' }, { status: 500, headers: apiVersionHeaders() });
  }

  try {
    const meta = getRequestMeta(request);
    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'create',
      tableName: 'product_images',
      recordId: row.id,
      recordLabel: `${product.name} — imagem`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (e) {
    log.warn('logActivity failed', undefined, e);
  }

  revalidateTag('products');
  return NextResponse.json({ ok: true, item: row }, { headers: apiVersionHeaders() });
}

/**
 * PATCH com 2 modos:
 * - { image_id, alt_text } — atualiza o alt_text de uma imagem específica
 * - { order: [id1, id2, ...] } — reordena imagens setando display_order na ordem do array
 */
export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: productId } = await ctx.params;
  const body = (await request.json().catch(() => null)) as
    | { image_id?: string; alt_text?: string | null; order?: string[] }
    | null;
  if (!body) {
    return NextResponse.json({ ok: false, message: 'JSON inválido.' }, { status: 400, headers: apiVersionHeaders() });
  }

  const db = getSupabaseAdminClient();

  if (Array.isArray(body.order)) {
    // Reordenação em batch — UPDATE de cada display_order
    const updates = await Promise.all(
      body.order.map((imageId, index) =>
        db
          .from('product_images')
          .update({ display_order: index })
          .eq('id', imageId)
          .eq('product_id', productId),
      ),
    );
    const failed = updates.find((u) => u.error);
    if (failed?.error) {
      log.warn('reorder failed', { productId }, failed.error);
      return NextResponse.json({ ok: false, message: failed.error.message }, { status: 500, headers: apiVersionHeaders() });
    }
    revalidateTag('products');
    return NextResponse.json({ ok: true }, { headers: apiVersionHeaders() });
  }

  if (body.image_id) {
    const { error } = await db
      .from('product_images')
      .update({ alt_text: body.alt_text ?? null })
      .eq('id', body.image_id)
      .eq('product_id', productId);
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
    }
    revalidateTag('products');
    return NextResponse.json({ ok: true }, { headers: apiVersionHeaders() });
  }

  return NextResponse.json({ ok: false, message: 'Payload inválido (esperado image_id+alt_text OU order).' }, { status: 400, headers: apiVersionHeaders() });
}

/** Remove uma imagem da galeria (storage + DB). */
export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }
  const { id: productId } = await ctx.params;
  const imageId = new URL(request.url).searchParams.get('image_id');
  if (!imageId) {
    return NextResponse.json({ ok: false, message: 'image_id obrigatório.' }, { status: 400, headers: apiVersionHeaders() });
  }

  const db = getSupabaseAdminClient();
  const { data: row } = await db
    .from('product_images')
    .select('id, image_url')
    .eq('id', imageId)
    .eq('product_id', productId)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ ok: false, message: 'Imagem não encontrada.' }, { status: 404, headers: apiVersionHeaders() });
  }

  // Extrai o path do storage a partir da URL pública
  const url = row.image_url;
  const pathMatch = url.match(/\/storage\/v1\/object\/public\/site-public\/(.+)$/);
  const storagePath = pathMatch?.[1];

  const { error: deleteError } = await db.from('product_images').delete().eq('id', imageId);
  if (deleteError) {
    return NextResponse.json({ ok: false, message: deleteError.message }, { status: 500, headers: apiVersionHeaders() });
  }

  if (storagePath) {
    await db.storage.from('site-public').remove([storagePath]).catch((e) => {
      log.warn('storage remove failed (DB row ok)', { storagePath }, e);
    });
  }

  try {
    const meta = getRequestMeta(request);
    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'delete',
      tableName: 'product_images',
      recordId: imageId,
      recordLabel: 'galeria',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (e) {
    log.warn('logActivity failed', undefined, e);
  }

  revalidateTag('products');
  return NextResponse.json({ ok: true }, { headers: apiVersionHeaders() });
}
