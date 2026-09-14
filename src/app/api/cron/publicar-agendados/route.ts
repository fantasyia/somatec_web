import { NextResponse, type NextRequest } from 'next/server';
import { publicarAgendados } from '@/lib/blog/agendados';
import { revalidateTag, revalidatePath } from '@/lib/cache';
import { TAG_BLOG } from '@/lib/blog/fonte';
import { validateBearer } from '@/lib/auth/bearer';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron-publicar-agendados');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron: publica os posts cujo horário agendado já chegou (M13 da auditoria).
 *
 * Auth igual à das outras rotas de cron: Bearer CRON_SECRET.
 *
 * A purga do cache mora AQUI, e não na função de banco, porque `revalidateTag`
 * precisa do contexto de requisição. É a mesma purga imediata que o
 * `/api/blog/revalidar` usa quando o CMS avisa que publicou — publicar sem
 * derrubar o cache deixaria o artigo existindo no banco e invisível no site
 * por até 5 minutos, que é o mesmo sintoma do defeito que este item conserta.
 */
export async function GET(req: NextRequest) {
  const check = validateBearer(req.headers.get('authorization'), 'CRON_SECRET', {
    requireInProduction: true,
  });
  if (!check.ok) {
    if (check.reason === 'missing_secret') {
      return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const publicados = await publicarAgendados();

    if (publicados.length > 0) {
      revalidateTag(TAG_BLOG);
      revalidatePath('/blog', 'page');
      // a home mostra o teaser do blog; 'layout' pega ela e o que herda dela
      revalidatePath('/', 'layout');
      for (const p of publicados) revalidatePath(`/blog/${p.slug}`, 'page');
    }

    return NextResponse.json({ ok: true, publicados: publicados.length, slugs: publicados.map((p) => p.slug) });
  } catch (e) {
    log.error('rodada de publicação agendada falhou', undefined, e);
    return NextResponse.json({ ok: false, error: 'falha ao publicar agendados' }, { status: 500 });
  }
}
