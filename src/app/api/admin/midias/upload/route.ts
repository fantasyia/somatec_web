import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';
import { createLogger } from '@/lib/logger';

const log = createLogger('midias-upload');

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
]);

export async function POST(request: NextRequest) {
  const user = await requireAdmin().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ ok: false, message: 'Arquivo obrigatório.' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ ok: false, message: 'Arquivo muito grande (máx. 10MB).' }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ ok: false, message: `Tipo de arquivo não permitido: ${file.type || 'desconhecido'}.` }, { status: 400 });
  }

  const db = getSupabaseAdminClient();
  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? nameParts.pop()!.toLowerCase() : 'bin';
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const path = `uploads/${timestamp}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await db.storage
    .from('site-public')
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (uploadError) {
    log.warn('storage upload failed', { path, mime: file.type, size: file.size }, uploadError);
    return NextResponse.json({ ok: false, message: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = db.storage.from('site-public').getPublicUrl(path);

  const { data: asset, error: insertError } = await db.from('media_assets').insert({
    bucket: 'site-public',
    path,
    public_url: publicUrl,
    file_name: file.name,
    file_type: ext,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: user.id,
  }).select('id').single();

  if (insertError || !asset) {
    log.error('media_assets insert failed', { path }, insertError);
    // upload já subiu para o storage — tenta limpar pra evitar órfãos
    await db.storage.from('site-public').remove([path]).catch(() => {});
    return NextResponse.json({ ok: false, message: 'Falha ao registrar mídia.' }, { status: 500 });
  }

  const meta = getRequestMeta(request);
  await logActivity({ userId: user.id, userEmail: user.email, action: 'upload', tableName: 'media_assets', recordId: asset.id, recordLabel: file.name, ...meta });

  return NextResponse.json({ ok: true, url: publicUrl, id: asset.id });
}
