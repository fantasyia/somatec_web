import type { ArticleBlock, ArticleTable } from '@/lib/constants/blog-content';

// =============================================================================
// O corpo do artigo, na ordem em que foi escrito.
//
// Antes o template só sabia desenhar parágrafo. As tabelas do CMS eram
// descartadas ainda na tradução — e tabela comparativa é justamente o formato
// que o leitor procura e que a busca extrai. Aqui elas voltam, no lugar certo:
// logo depois do parágrafo que as apresenta.
//
// No celular a tabela rola SOZINHA, dentro da própria moldura. Deixar a página
// inteira rolar de lado por causa de uma tabela de 3 colunas quebra a leitura
// de tudo o que está em volta.
// =============================================================================

function Tabela({ tabela }: { tabela: ArticleTable }) {
  const colunas = tabela.cabecalho.length || tabela.linhas[0]?.length || 0;

  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-card border border-[rgb(var(--border))]">
        <table className="w-full border-collapse text-left text-[15px] leading-relaxed">
          {tabela.cabecalho.length > 0 && (
            <thead>
              <tr className="bg-[rgb(var(--navy))]">
                {tabela.cabecalho.map((celula, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="px-3 py-3 md:px-4 font-semibold text-white"
                  >
                    {celula}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {tabela.linhas.map((linha, i) => (
              <tr
                key={i}
                className="border-t border-[rgb(var(--border))] align-top odd:bg-[rgb(var(--surface))] even:bg-[rgb(var(--bg))]"
              >
                {linha.map((celula, j) => (
                  <td
                    key={j}
                    className={
                      j === 0
                        ? 'px-3 py-3 font-medium text-[rgb(var(--text))] md:px-4'
                        : 'px-3 py-3 text-[rgb(var(--text-muted))] md:px-4'
                    }
                  >
                    {celula}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tabela.legenda && (
        <figcaption className="mt-2 text-sm text-[rgb(var(--text-muted))]">{tabela.legenda}</figcaption>
      )}
      {/* Sem o aviso, o leitor de celular conclui que a tabela veio cortada.
          Medido no Chromium: de 3 colunas pra cima a moldura passa da largura
          do telefone; com 2 cabe. Do tablet pra cima nada rola. */}
      {colunas >= 3 && (
        <figcaption className="mt-1 text-xs text-[rgb(var(--text-muted))] md:hidden">
          Arraste a tabela para o lado para ver todas as colunas.
        </figcaption>
      )}
    </figure>
  );
}

export function BlocosArtigo({ blocos }: { blocos: ArticleBlock[] }) {
  return (
    <>
      {blocos.map((bloco, i) =>
        bloco.tipo === 'tabela' ? (
          <Tabela key={i} tabela={bloco.tabela} />
        ) : (
          <p key={i} className="mb-4 text-[17px] leading-[1.85] text-[rgb(var(--text))]">
            {bloco.texto}
          </p>
        ),
      )}
    </>
  );
}
