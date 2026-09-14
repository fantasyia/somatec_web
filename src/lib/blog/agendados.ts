import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('blog-agendados');

// =============================================================================
// PUBLICAÇÃO DE POST AGENDADO — M13 da auditoria 13/09.
//
// O CMS sempre teve o status "Agendado": seletor de data, etiqueta amarela e
// filtro na listagem. E nada, em lugar nenhum, publicava um post agendado. A
// data passava e o artigo ficava parado para sempre, sem erro e sem aviso —
// uma opção que a tela oferece e o sistema não cumpre.
//
// ⚠️ O `published_at` recebe o `scheduled_at`, NÃO o instante em que a rodada
// aconteceu. O agendador roda de 5 em 5 minutos, então publicar "agora"
// carimbaria uma data até 5 minutos adiante da combinada — e, em post
// retroagido de propósito, jogaria a data lá pra frente.
//
// A troca de estado é o próprio filtro: o `update` exige `status = 'scheduled'`
// e, se duas rodadas se cruzarem, a segunda casa com zero linhas. Mesma
// mecânica da reserva de linha da fila de webhook.
// =============================================================================

export type PostPublicado = { slug: string; agendadoPara: string };

/** Publica todo post cujo horário já chegou. Devolve o que MUDOU de estado. */
export async function publicarAgendados(agora = new Date()): Promise<PostPublicado[]> {
  // `posts` é tabela do CMS e não está em `@/types/database` — o site só lê
  // dela (o `fonte.ts` faz o mesmo por cast na leitura). Cliente sem tipo aqui
  // é o preço de escrever numa tabela de outro repositório; o formato do
  // update é conferido pelo teste, não pelo compilador.
  const supabase = getSupabaseAdminClient() as unknown as SupabaseClient;

  const { data: vencidos, error: erroBusca } = await supabase
    .from('posts')
    .select('id, slug, scheduled_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', agora.toISOString())
    .is('deleted_at', null)
    .limit(50);

  if (erroBusca) {
    // log.error de propósito: "nenhum agendado" e "o banco não respondeu" são
    // indistinguíveis pra quem só olha o resultado, e o segundo é incidente.
    log.error('falha buscando posts agendados', { error: erroBusca });
    throw new Error('nao foi possivel buscar posts agendados');
  }

  const linhas = (vencidos ?? []) as { id: string; slug: string; scheduled_at: string }[];
  if (linhas.length === 0) return [];

  const publicados: PostPublicado[] = [];

  for (const linha of linhas) {
    const { data, error } = await supabase
      .from('posts')
      .update({
        published: true,
        status: 'published',
        published_at: linha.scheduled_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linha.id)
      // A guarda que impede publicar duas vezes: quem chegou primeiro já
      // trocou o status, e a segunda rodada não acha mais a linha.
      .eq('status', 'scheduled')
      .select('slug');

    if (error) {
      log.error('falha publicando post agendado', { slug: linha.slug, error });
      continue;
    }
    if ((data ?? []).length > 0) {
      publicados.push({ slug: linha.slug, agendadoPara: linha.scheduled_at });
    }
  }

  if (publicados.length > 0) {
    log.info('posts agendados publicados', { slugs: publicados.map((p) => p.slug) });
  }
  return publicados;
}
