import { Home, Store, type LucideIcon } from 'lucide-react';
import type { PublicoNI } from '@/lib/constants/publico-clusters';

/**
 * ANDAIME DE LAYOUT — cards falsos da seção "Blog do público" das LPs NI.
 *
 * Existe por um motivo só: o Léo precisa validar o layout das LPs COM a seção
 * de blog na tela, e hoje ela não tem o que mostrar (os dois artigos NI do
 * acervo são stubs `emPreparacao`, estado temporário da validação com o
 * Leandro). Sem isto a seção some da página e não há o que validar.
 *
 * 🔒 NUNCA aparece pro público. Só renderiza enquanto `SITE_NOINDEX === 'true'`
 * — a MESMA chave do go-live. Quando o site abrir, o andaime cai sozinho, sem
 * ninguém precisar lembrar. `tests/blog-publico-placeholder.test.ts` reprova o
 * build se alguém afrouxar essa condição.
 *
 * ⚠️ E não é um artigo disfarçado: cada card diz "Exemplo de layout" em cima e
 * não leva a lugar nenhum (não é link). Card falso que parece de verdade vira
 * print em reunião e, mais cedo ou mais tarde, promessa que a empresa não fez.
 *
 * Quando o Blogueiro publicar artigo NI de verdade, o `BlogDoPublico` mostra o
 * artigo e este arquivo deixa de ser chamado — aí ele pode sumir do repo.
 */

type CardFalso = { titulo: string; excerpt: string; pill: string; Icon: LucideIcon };

const EXEMPLOS: Record<PublicoNI, CardFalso[]> = {
  comercial: [
    {
      titulo: 'Título do artigo ocupa até duas linhas aqui',
      excerpt:
        'Resumo do artigo em duas linhas — é o espaço que a chamada real vai ocupar quando a redação publicar.',
      pill: 'Comércio',
      Icon: Store,
    },
    {
      titulo: 'Segundo card, mesma altura do primeiro',
      excerpt:
        'A grade fixa três colunas no desktop e empilha no celular; o card estica pra acompanhar o vizinho mais alto.',
      pill: 'Comércio',
      Icon: Store,
    },
    {
      titulo: 'Terceiro card fecha a linha',
      excerpt:
        'Com menos de três artigos a grade se ajusta sozinha — um card ocupa metade da largura, dois dividem ao meio.',
      pill: 'Comércio',
      Icon: Store,
    },
  ],
  residencial: [
    {
      titulo: 'Título do artigo ocupa até duas linhas aqui',
      excerpt:
        'Resumo do artigo em duas linhas — é o espaço que a chamada real vai ocupar quando a redação publicar.',
      pill: 'Residencial',
      Icon: Home,
    },
    {
      titulo: 'Segundo card, mesma altura do primeiro',
      excerpt:
        'A grade fixa três colunas no desktop e empilha no celular; o card estica pra acompanhar o vizinho mais alto.',
      pill: 'Residencial',
      Icon: Home,
    },
    {
      titulo: 'Terceiro card fecha a linha',
      excerpt:
        'Com menos de três artigos a grade se ajusta sozinha — um card ocupa metade da largura, dois dividem ao meio.',
      pill: 'Residencial',
      Icon: Home,
    },
  ],
};

export function BlogDoPublicoPlaceholder({ publico }: { publico: PublicoNI }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {EXEMPLOS[publico].map(({ titulo, excerpt, pill, Icon }) => (
        <article
          key={titulo}
          className="flex h-full flex-col overflow-hidden card-elevated"
          aria-label="Exemplo de layout — artigo em preparação"
        >
          {/* Hero 16:9, mesmo gradiente do card real sem imagem */}
          <div
            className="flex aspect-video w-full items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgb(0,65,110) 0%, rgb(0,140,200) 100%)' }}
            aria-hidden="true"
          >
            <Icon className="h-10 w-10 text-white/85" strokeWidth={1.5} />
          </div>

          <div className="flex flex-1 flex-col gap-2.5 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="placeholder-tag">Exemplo de layout</span>
              <span className="inline-flex items-center rounded-full bg-cyan/10 px-2.5 py-1 font-sans text-[11px] font-semibold text-cyan">
                {pill}
              </span>
            </div>

            <h3 className="font-serif text-lg font-bold leading-snug text-[rgb(var(--text))]">
              {titulo}
            </h3>

            <p className="line-clamp-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
              {excerpt}
            </p>

            <div className="mt-auto pt-1 font-sans text-xs text-[rgb(var(--text-muted))]">
              Artigo em preparação
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
