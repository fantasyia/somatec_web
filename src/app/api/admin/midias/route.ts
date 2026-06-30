import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin-midias');

export async function DELETE(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, message: 'ID obrigatório.' }, { status: 400 });

  const db = getSupabaseAdminClient();
  const { data: asset } = await db.from('media_assets').select('bucket, path').eq('id', id).maybeSingle();
  if (!asset) return NextResponse.json({ ok: false, message: 'Mídia não encontrada.' }, { status: 404 });

  // Deleta o registro no banco PRIMEIRO e propaga erro — evita sucesso fantasma
  // (antes retornava 200 mesmo quando o delete falhava).
  const { error: deleteError } = await db.from('media_assets').delete().eq('id', id);
  if (deleteError) {
    return NextResponse.json({ ok: false, message: deleteError.message }, { status: 500 });
  }

  // Remoção no storage é best-effort: o registro já saiu; se falhar, loga e segue
  // (órfão de arquivo no bucket é tolerável e fica registrado).
  const { error: storageError } = await db.storage.from(asset.bucket).remove([asset.path]);
  if (storageError) {
    log.warn('storage remove falhou (registro do banco já removido)', { path: asset.path }, storageError);
  }

  await logActivity({ userId: user.id, userEmail: user.email, action: 'delete', tableName: 'media_assets', recordId: id, ...getRequestMeta(request) });
  return NextResponse.json({ ok: true });
}
