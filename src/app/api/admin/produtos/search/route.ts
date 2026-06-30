import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { apiVersionHeaders } from '@/lib/http/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Autocomplete simples de produtos. Usado pelo RecipeProductsEditor pra
 * vincular produtos a receitas. Busca por `name` (ILIKE).
 *
 * Query params:
 *   - q: termo de busca (mínimo 1 char). Vazio → retorna primeiros 20.
 *   - limit: máx itens (default 20, max 50)
 */
export async function GET(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));

  const db = getSupabaseAdminClient();
  let query = db.from('products').select('id, name, slug, main_image_url').order('name').limit(limit);
  if (q.length > 0) {
    query = query.ilike('name', `%${q}%`);
  }
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
  }
  return NextResponse.json({ ok: true, items: data ?? [] }, { headers: apiVersionHeaders() });
}
