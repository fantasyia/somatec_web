import 'server-only';
import { unstable_cache } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { htmlParaArtigo } from '@/lib/blog/html-para-artigo';
import type { BlogPost } from '@/lib/constants/blog';
import { BLOG_POSTS } from '@/lib/constants/blog';
import type { ArticleContent } from '@/lib/constants/blog-content';
import { getArticleContent as conteudoDeArquivo } from '@/lib/constants/blog-content';
import { publicoDoCluster, type PublicoNI } from '@/lib/constants/publico-clusters';

const log = createLogger('blog-fonte');

// =============================================================================
// FONTE DO BLOG — banco (CMS) com o arquivo como rede de segurança.
//
// O artigo passa a nascer no Mini WordPress e a viver no Supabase. Este módulo
// é o único lugar do site que sabe disso: tudo o mais continua falando com
// `BlogPost` e `ArticleContent`, os mesmos tipos de antes.
//
// REGRA DE OURO DA TROCA: se o banco não responder, ou não tiver nenhum post
// publicado, o site cai no `blog.ts` e segue mostrando o que mostra hoje. Um
// blog que some porque o banco piscou é pior que um blog desatualizado.
//
// Enquanto os artigos do CMS estiverem como rascunho, a consulta devolve vazio
// e o site continua exatamente como está — a troca é invisível até o Léo
// publicar o primeiro.
// =============================================================================

/** Minutos que o site segura o resultado antes de ir buscar de novo.
 *  Existe revalidação sob demanda (`/api/blog/revalidar`), mas o tempo é a
 *  garantia de que o conteúdo atualiza sozinho mesmo se o CMS estiver
 *  desligado na hora da publicação — ele roda na máquina do Léo. */
const SEGUNDOS_DE_CACHE = 300;

export const TAG_BLOG = 'blog-cms';

type LinhaCms = {
  slug: string;
  title: string;
  excerpt: string | null;
  meta_description: string | null;
  content_html: string | null;
  hero_image_url: string | null;
  cover_image: string | null;
  published_at: string | null;
  updated_at: string | null;
  is_featured: boolean | null;
  author_name: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  expert_name: string | null;
  expert_role: string | null;
  expert_bio: string | null;
  expert_credentials: string | null;
  silos: { name: string | null } | null;
};

/** Assinatura do artigo — quem escreveu e quem revisou tecnicamente.
 *  Em conteúdo YMYL (segurança elétrica + dinheiro) o Google cobra isso, e o
 *  que dá peso é a pessoa, não a empresa. */
export type Assinatura = {
  autor: string | null;
  revisor: string | null;
  revisadoEm: string | null;
  especialista: { nome: string; papel: string | null; bio: string | null; credencial: string | null } | null;
};

const CAMPOS =
  'slug,title,excerpt,meta_description,content_html,hero_image_url,cover_image,published_at,updated_at,is_featured,' +
  'author_name,reviewed_by,reviewed_at,expert_name,expert_role,expert_bio,expert_credentials,silos:silo_id(name)';

/** Minutos de leitura a partir do texto — o CMS não guarda esse campo.
 *  200 palavras/min é a média de leitura técnica em português. */
function tempoDeLeitura(html: string | null): number {
  const palavras = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

function paraBlogPost(linha: LinhaCms): BlogPost {
  return {
    slug: linha.slug,
    titulo: linha.title,
    excerpt: linha.excerpt || linha.meta_description || '',
    cluster: linha.silos?.name || 'Sem cluster',
    tempoLeitura: tempoDeLeitura(linha.content_html),
    heroUrl: linha.hero_image_url || linha.cover_image || null,
    publicadoEm: (linha.published_at || linha.updated_at || '').slice(0, 10),
    destaque: Boolean(linha.is_featured),
  };
}

async function buscarNoBanco(): Promise<LinhaCms[] | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('posts')
      .select(CAMPOS)
      .eq('published', true)
      .is('deleted_at', null)
      .order('published_at', { ascending: false });

    if (error) {
      // log.error de propósito: erro do banco virando "sem artigo" silencioso é
      // exatamente como o blog sumiria sem ninguém notar.
      log.error('falha lendo posts do CMS', { error });
      return null;
    }
    return (data as unknown as LinhaCms[]) ?? [];
  } catch (e) {
    log.error('exceção lendo posts do CMS', { error: e });
    return null;
  }
}

const buscarCacheado = unstable_cache(buscarNoBanco, ['blog-posts-cms'], {
  revalidate: SEGUNDOS_DE_CACHE,
  tags: [TAG_BLOG],
});

export type Acervo = {
  posts: BlogPost[];
  /** De onde veio — aparece no /status e nos testes. */
  origem: 'cms' | 'arquivo';
  corpos: Map<string, string>;
  assinaturas: Map<string, Assinatura>;
};

/** O acervo publicado. Banco primeiro; arquivo se o banco não tiver nada. */
export async function lerAcervo(): Promise<Acervo> {
  const linhas = await buscarCacheado();

  if (!linhas || linhas.length === 0) {
    const posts = [...BLOG_POSTS]
      .filter((p) => conteudoDeArquivo(p.slug) !== undefined)
      .sort((a, b) => (a.publicadoEm < b.publicadoEm ? 1 : -1));
    return { posts: posts as BlogPost[], origem: 'arquivo', corpos: new Map(), assinaturas: new Map() };
  }

  const corpos = new Map<string, string>();
  const assinaturas = new Map<string, Assinatura>();
  for (const l of linhas) {
    if (l.content_html) corpos.set(l.slug, l.content_html);
    assinaturas.set(l.slug, {
      autor: l.author_name,
      revisor: l.reviewed_by,
      revisadoEm: l.reviewed_at,
      especialista: l.expert_name
        ? {
            nome: l.expert_name,
            papel: l.expert_role,
            bio: l.expert_bio,
            credencial: l.expert_credentials,
          }
        : null,
    });
  }

  return {
    posts: linhas.map(paraBlogPost),
    origem: 'cms',
    corpos,
    assinaturas,
  };
}

export async function lerPosts(): Promise<BlogPost[]> {
  return (await lerAcervo()).posts;
}

export async function lerPost(slug: string): Promise<BlogPost | undefined> {
  return (await lerAcervo()).posts.find((p) => p.slug === slug);
}

/** O corpo do artigo, já na estrutura que o template usa. */
export async function lerConteudo(slug: string): Promise<ArticleContent | undefined> {
  const acervo = await lerAcervo();
  if (acervo.origem === 'arquivo') return conteudoDeArquivo(slug);

  const html = acervo.corpos.get(slug);
  if (!html) return undefined;
  const post = acervo.posts.find((p) => p.slug === slug);
  return htmlParaArtigo(html, { atualizadoEm: post?.publicadoEm });
}

/** Quem assina o artigo. Vazio quando o acervo vem do arquivo — os posts
 *  antigos não têm autoria cadastrada. */
export async function lerAssinatura(slug: string): Promise<Assinatura | undefined> {
  return (await lerAcervo()).assinaturas.get(slug);
}

/** HTML cru — só pra quem precisa do schema embutido. */
export async function lerHtmlBruto(slug: string): Promise<string | undefined> {
  return (await lerAcervo()).corpos.get(slug);
}

export async function lerDestaque(): Promise<BlogPost | undefined> {
  const posts = await lerPosts();
  return posts.find((p) => p.destaque) ?? posts[0];
}

/** Os 4 do teaser da home: destaque + 3 seguintes, todos com hero real. */
export async function lerTeaser(): Promise<BlogPost[]> {
  const comHero = (await lerPosts()).filter((p) => p.heroUrl);
  if (comHero.length === 0) return [];
  const destaque = comHero.find((p) => p.destaque) ?? comHero[0];
  return [destaque, ...comHero.filter((p) => p.slug !== destaque.slug).slice(0, 3)];
}

/** Artigos de um público NI — seção "Blog do público" das LPs.
 *  O público sai do CLUSTER (config única), a mesma fonte que o menu e o
 *  template de artigo usam. */
export async function lerPostsDoPublico(publico: PublicoNI, limite = 3): Promise<BlogPost[]> {
  const acervo = await lerAcervo();
  return acervo.posts
    .filter((p) => publicoDoCluster(p.cluster) === publico)
    .filter((p) =>
      // no arquivo, artigo com stub "em preparação" não entra na LP
      acervo.origem === 'arquivo' ? !conteudoDeArquivo(p.slug)?.emPreparacao : true,
    )
    .slice(0, limite);
}

/** Rotas /blog/... que pertencem ao público não-industrial.
 *  O menu e o rodapé usam isto pra esconder ferramenta industrial — e são
 *  client components, então quem chama é o layout (server) e passa por props. */
export async function lerSlugsNi(): Promise<string[]> {
  return (await lerPosts())
    .filter((p) => publicoDoCluster(p.cluster) !== null)
    .map((p) => `/blog/${p.slug}`);
}
