import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { revalidateTag } from '@/lib/cache';
import { createLogger } from '@/lib/logger';
import { apiVersionHeaders } from '@/lib/http/headers';

const log = createLogger('admin-reorder');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Endpoint genérico de reordenação por display_order.
 * Recebe { table, order: [id1, id2, ...] } e atualiza display_order de cada id
 * para o índice no array.
 *
 * Tabelas permitidas (whitelist) — qualquer outra retorna 400.
 */
const ALLOWED_TABLES = {
  home_slider_items: { tag: 'home-slider', label: 'slider' },
  home_indicators: { tag: 'home-indicators', label: 'indicador' },
  home_cta_cards: { tag: 'home-cta', label: 'CTA card' },
  banners: { tag: 'banners', label: 'banner' },
  navigation_items: { tag: 'navigation', label: 'item de navegação' },
  footer_links: { tag: 'footer', label: 'link do footer' },
  footer_columns: { tag: 'footer', label: 'coluna do footer' },
} as const;

type AllowedTable = keyof typeof ALLOWED_TABLES;

const reorderSchema = z.object({
  table: z.enum(Object.keys(ALLOWED_TABLES) as [AllowedTable, ...AllowedTable[]]),
  order: z.array(z.string().uuid()).min(1).max(200),
});

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401, headers: apiVersionHeaders() });
  }

  const raw = (await request.json().catch(() => null)) as unknown;
  const parsed = reorderSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, message: `${issue?.path.join('.') ?? 'body'}: ${issue?.message ?? 'inválido'}` },
      { status: 400, headers: apiVersionHeaders() },
    );
  }

  const { table, order } = parsed.data;
  const config = ALLOWED_TABLES[table];

  const db = getSupabaseAdminClient();
  // Reordenação ATÔMICA via RPC (uma transação): valida que todos os ids existem
  // na tabela e seta display_order = posição no array. Antes eram N UPDATEs
  // paralelos sem transação nem checagem — falha parcial deixava a ordem
  // inconsistente e ids de outra entidade passavam silenciosamente.
  type RpcResult = { data: number | null; error: { message: string; code?: string } | null };
  const rpc = (await db.rpc(
    'reorder_by_display_order' as never,
    { p_table: table, p_ids: order } as never,
  )) as RpcResult;

  if (rpc.error) {
    const rpcMissing =
      rpc.error.code === '42883' ||
      /reorder_by_display_order|does not exist|não existe|could not find/i.test(rpc.error.message);
    if (!rpcMissing) {
      log.warn('reorder rpc failed', { table }, rpc.error);
      return NextResponse.json({ ok: false, message: rpc.error.message }, { status: 500, headers: apiVersionHeaders() });
    }
    // Fallback enquanto a migração da RPC não foi aplicada: updates SEQUENCIAIS com
    // checagem por linha (rejeita id inexistente). Melhor que o paralelo-silencioso antigo.
    log.warn('reorder: RPC ausente, usando fallback sequencial', { table });
    for (let i = 0; i < order.length; i++) {
      const { data, error } = await db
        .from(table)
        .update({ display_order: i })
        .eq('id', order[i]!)
        .select('id')
        .maybeSingle();
      if (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: apiVersionHeaders() });
      }
      if (!data) {
        return NextResponse.json(
          { ok: false, message: `id não encontrado em ${table}: ${order[i]}` },
          { status: 409, headers: apiVersionHeaders() },
        );
      }
    }
  }

  try {
    const meta = getRequestMeta(request);
    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'update',
      tableName: table,
      recordLabel: `reorder · ${order.length} ${config.label}(s)`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch (e) {
    log.warn('logActivity failed', undefined, e);
  }

  revalidateTag(config.tag);
  return NextResponse.json({ ok: true, count: order.length }, { headers: apiVersionHeaders() });
}
