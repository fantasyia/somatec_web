import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from '@/lib/cache';
import { TAG_BLOG } from '@/lib/blog/fonte';
import { createLogger } from '@/lib/logger';
import { constantTimeEquals } from '@/lib/auth/bearer';

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

// ⛔ SÓ CABEÇALHO, E EM TEMPO CONSTANTE (M7 da auditoria 13/09).
//
// Duas coisas estavam erradas aqui, e a segunda é a que já custou um segredo:
//
// 1. `===` em segredo vaza o tamanho do prefixo certo pelo tempo de resposta.
//    `constantTimeEquals` não sai mais cedo no primeiro byte diferente.
// 2. O segredo também era aceito em `?secret=`, e query string entra em log de
//    servidor, de proxy, de CDN e no Referer. Foi por esse caminho que o valor
//    antigo apareceu em saída de sessão em 25/08 — e por isso ele teve de ser
//    rotacionado em 14/09. Manter a porta aberta seria repetir o vazamento com
//    o segredo novo.
function autorizado(req: Request): boolean {
  const segredo = process.env.BLOG_REVALIDATE_SECRET;
  if (!segredo) return false;
  return constantTimeEquals(req.headers.get('x-revalidate-secret') || '', segredo);
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

  // Purga IMEDIATA, pelo wrapper de `@/lib/cache` (`{ expire: 0 }`).
  //
  // Estava `revalidateTag(TAG_BLOG, 'max')`, do `next/cache` direto: em Next 16
  // o perfil 'max' é stale-while-revalidate, então a primeira visita depois de
  // publicar ainda podia receber o conteúdo velho enquanto a revalidação
  // rodava atrás. O `/api/revalidate` já usava o wrapper imediato — os dois
  // caminhos de purga discordavam entre si.
  revalidateTag(TAG_BLOG);
  revalidatePath('/blog', 'page');
  // a home mostra o teaser do blog; 'layout' pega ela e o que herda dela
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/blog/${slug}`, 'page');

  log.info('blog revalidado', { slug: slug ?? '(acervo inteiro)' });
  return NextResponse.json({ ok: true, slug: slug ?? null, revalidadoEm: new Date().toISOString() });
}

// POST e nada mais. O GET existia "pra testar do navegador com o segredo na
// query" — ou seja, era o próprio convite a colocar o segredo na URL. Quem
// chama isto é o CMS (`lib/site-remoto.ts`), que já usa POST com o cabeçalho.
export async function POST(req: Request) {
  return revalidar(req);
}
