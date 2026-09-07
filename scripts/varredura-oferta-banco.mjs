#!/usr/bin/env node
// =============================================================================
// VARREDURA DE OFERTA MORTA — no BANCO, não no código.
//
// Uso:  node scripts/varredura-oferta-banco.mjs
//       npm run varredura:banco
//
// Por que existe: `tests/copy-guards.test.ts` varre ARQUIVOS. Mas o site serve
// conteúdo que vem do Supabase — o blog inteiro é `posts.content_html`, e
// `site_settings` guarda banner de cookie, texto de LGPD e as metas de SEO.
// Nada disso passava por guarda nenhuma.
//
// Em 07/09 isso apareceu: 15 artigos no banco vendiam a oferta que morreu em
// 03/09, com texto afirmativo ("você só paga se o resultado for comprovado").
// Os `.md` do repo do blog tinham sido corrigidos; o que já estava no CMS, não.
// Exposição era zero só porque todos estavam em `draft` — publicar qualquer um
// poria a oferta morta no ar, e o /llms.txt a entregaria pro ChatGPT junto.
//
// ⚠️ NÃO vira teste do vitest de propósito. Um teste que depende de rede e de
// credencial ou quebra o build de quem não tem acesso, ou "passa" pulando em
// silêncio — e silêncio é exatamente a falha que este projeto já pagou caro.
// Aqui, sem credencial o script FALHA e diz o porquê.
//
// Exit 1 se achar qualquer coisa, ou se não conseguir olhar.
// =============================================================================

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { APOSENTADO, APOSENTADO_SLUG } from './vocabulario-aposentado.mjs';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Sem NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
  console.error('   A varredura NÃO rodou. Isso é falha, não "pulou": conteúdo');
  console.error('   de banco fica sem nenhuma guarda quando isto não roda.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

/** Acha os termos aposentados num texto e devolve o trecho em volta. */
function achar(texto, lista = APOSENTADO) {
  if (!texto) return [];
  const limpo = String(texto).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const achados = [];
  for (const { re, morreu, porque } of lista) {
    const m = limpo.match(re);
    if (!m) continue;
    const i = Math.max(0, m.index - 60);
    achados.push({ termo: m[0], morreu, porque, trecho: limpo.slice(i, m.index + m[0].length + 60).trim() });
  }
  return achados;
}

let problemas = 0;

// ── posts ───────────────────────────────────────────────────────────────────
const { data: posts, error: ePosts } = await db
  .from('posts')
  .select('slug, status, title, excerpt, content_html, deleted_at, published');

if (ePosts) {
  console.error('❌ Não consegui ler `posts`:', ePosts.message);
  process.exit(1);
}

// ⚓ ÂNCORA ANTI-FALSO-VERDE — e ela já pegou um caso, na primeira execução.
//
// O Supabase devolve `[]` SEM ERRO quando a chave não tem permissão de ler a
// tabela. O `.env.local` deste repo guarda uma chave ANON no campo
// SUPABASE_SERVICE_ROLE_KEY, o RLS barrou `posts`, e a varredura terminou com
// "0 posts" e um ✅ — verde sobre uma tabela que ela nem enxergou.
//
// Um blog sem nenhum post é sinal de que não estamos vendo o dado, não de que
// está tudo limpo. Falhar aqui é o comportamento certo.
if (posts.length === 0) {
  console.error('❌ A tabela `posts` voltou VAZIA.');
  console.error('   Isso quase certamente é permissão, não ausência de conteúdo:');
  console.error('   o Supabase devolve [] sem erro quando a chave não pode ler.');
  console.error('   Confira se SUPABASE_SERVICE_ROLE_KEY é mesmo a service_role');
  console.error('   (a do .env.local já esteve com uma chave anon no lugar).');
  process.exit(1);
}

console.log(`Varrendo ${posts.length} posts e as chaves de site_settings...\n`);

for (const p of posts) {
  const achados = [
    ...achar(p.title).map((a) => ({ ...a, campo: 'title' })),
    ...achar(p.excerpt).map((a) => ({ ...a, campo: 'excerpt' })),
    ...achar(p.content_html).map((a) => ({ ...a, campo: 'content_html' })),
    // Slug precisa dos hífens virando espaço, senão NENHUM padrão casa:
    // "periodo-avaliacao-60-90-dias" não bate com /60 a 90 dias/. Escrevi
    // errado na primeira versão e a checagem era decorativa — só apareceu
    // porque fui conferir por que o post com a oferta no próprio slug estava
    // sendo pego pelo título e não por ele.
    ...achar(String(p.slug), APOSENTADO_SLUG).map((a) => ({
      ...a,
      campo: 'SLUG (vira URL pública — corrigir depois exige redirect)',
    })),
  ];
  if (!achados.length) continue;

  // Post excluído logicamente não alcança o site: `lerAcervo` filtra
  // `.is('deleted_at', null)`. Contar como problema faz a varredura nunca
  // ficar verde e ensina a ignorá-la — que é como guarda morre.
  // Continua listado, porque o texto ruim segue no banco e volta se alguém
  // reabrir o post.
  const excluido = p.deleted_at != null;
  if (!excluido) problemas += achados.length;

  const situacao = excluido
    ? 'EXCLUÍDO — fora do site, mas o texto continua no banco'
    : p.published
      ? '🔥 PUBLICADO — está no ar AGORA'
      : `${p.status} — invisível hoje, vira problema ao publicar`;
  console.log(`${excluido ? '⚪' : '🔴'} ${p.slug}  [${situacao}]`);
  for (const a of achados) {
    console.log(`     ${a.campo} · "${a.termo}" — ⛔ ${a.morreu}, ${a.porque}`);
    console.log(`     …${a.trecho}…\n`);
  }
}

// ── site_settings ───────────────────────────────────────────────────────────
const { data: cfg, error: eCfg } = await db.from('site_settings').select('key, value');
if (eCfg) {
  console.error('❌ Não consegui ler `site_settings`:', eCfg.message);
  process.exit(1);
}
for (const row of cfg) {
  const achados = achar(JSON.stringify(row.value));
  if (!achados.length) continue;
  problemas += achados.length;
  console.log(`🔴 site_settings.${row.key}`);
  for (const a of achados) console.log(`     "${a.termo}" — ⛔ ${a.morreu}, ${a.porque}\n`);
}

if (problemas) {
  console.log(`\n❌ ${problemas} ocorrência(s) de oferta aposentada no banco.`);
  console.log('   Reescrever o parágrafo inteiro — apagar o termo deixa o argumento pela metade.');
  console.log('   Modelo vigente: src/lib/constants/oferta-industrial.ts');
  process.exit(1);
}

console.log('✅ Nada de oferta aposentada no banco.');
