import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { TAG_BLOG } from '@/lib/blog/fonte';
import { createLogger } from '@/lib/logger';

const log = createLogger('blog-revalidar');

// =============================================================================
// Recarga do blog sob demanda.
//
// O CMS roda na máquina do Léo, não no ar. Ao publicar, ele chama esta rota e
// o site derruba o cache do blog na hora — em vez de esperar os 5 minutos do
// revalidate por tempo.
//
// O tempo continua existindo de propósito: se o CMS estiver desligado, ou a
// chamada falhar, o conteúdo ainda atualiza sozinho. Esta rota encurta a
// espera; não é o único caminho.
//
// ⛔ Protegida por segredo. Sem `BLOG_REVALIDATE_SECRET` no ambiente, a rota
// responde 503 e NÃO revalida — recusar é mais seguro que aceitar qualquer um
// derrubando o cache do site à vontade.
// =============================================================================

export const dynamic = 'force-dynamic';

function autorizado(req: Request): boolean {
  const segredo = process.env.BLOG_REVALIDATE_SECRET;
  if (!segredo) return false;
  const cabecalho = req.headers.get('x-revalidate-secret') || '';
  const url = new URL(req.url);
  const query = url.searchParams.get('secret') || '';
  return cabecalho === segredo || query === segredo;
}

async function revalidar(req: Request) {
  if (!process.env.BLOG_REVALIDATE_SECRET) {
    log.error('BLOG_REVALIDATE_SECRET ausente — revalidação sob demanda desligada');
    return NextResponse.json(
      { ok: false, erro: 'revalidação sob demanda não configurada' },
      { status: 503 },
    );
  }
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, erro: 'não autorizado' }, { status: 401 });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  // Next 16 exige o perfil de cache no revalidateTag; 'max' expira tudo que
  // carrega a tag, que é o que se quer ao publicar.
  revalidateTag(TAG_BLOG, 'max');
  revalidatePath('/blog', 'page');
  // a home mostra o teaser do blog; 'layout' pega ela e o que herda dela
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/blog/${slug}`, 'page');

  log.info('blog revalidado', { slug: slug ?? '(acervo inteiro)' });
  return NextResponse.json({ ok: true, slug: slug ?? null, revalidadoEm: new Date().toISOString() });
}

export async function POST(req: Request) {
  return revalidar(req);
}

// GET aceito pra dar pra testar do navegador com o segredo na query.
export async function GET(req: Request) {
  return revalidar(req);
}
