import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from '@/lib/cache';
import { validateBearer } from '@/lib/auth/bearer';

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  const check = validateBearer(request.headers.get('authorization'), 'REVALIDATE_SECRET', { requireInProduction: true });
  if (!check.ok) {
    if (check.reason === 'missing_secret') {
      return NextResponse.json({ ok: false, message: 'REVALIDATE_SECRET não configurado.' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });
  }

  if (!path && !tag) {
    return NextResponse.json(
      { ok: false, message: 'Parâmetro obrigatório: path ou tag.' },
      { status: 400 },
    );
  }

  const revalidated: Record<string, string> = {};

  if (path) {
    revalidatePath(path);
    revalidated.path = path;
  }

  if (tag) {
    revalidateTag(tag);
    revalidated.tag = tag;
  }

  return NextResponse.json({ ok: true, revalidated, now: Date.now() });
}

export { handler as GET, handler as POST };
