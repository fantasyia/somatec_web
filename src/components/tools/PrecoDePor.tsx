import { emPromocao, formatBRL, type MasterBlockModel } from '@/lib/constants/masterblock';

// =============================================================================
// "de R$ 4.999 por R$ 4.350" — o riscado do carrinho (card "Loja mostra
// de/por", decisão do Léo em 17/09/2026).
//
// Sem `precoTabela` acima do cobrado, renderiza só o preço, igual a antes. O
// valor cobrado é SEMPRE `preco`: este componente não decide preço, só mostra.
// Quem decide é o servidor (`precificar.ts`), lendo a mesma constante — e a
// guarda em `tests/preco-de-por.test.tsx` reprova se os dois divergirem.
//
// Acessibilidade: `<s>` não é anunciado pela maioria dos leitores de tela, então
// o "de … por …" vai por texto oculto. Quem ouve recebe a frase inteira; quem
// vê recebe o traço.
// =============================================================================

type Props = {
  modelo: Pick<MasterBlockModel, 'preco' | 'precoTabela'>;
  /** Classe do preço cobrado (o "por"). */
  className?: string;
  /** Classe do riscado. Default serve pro fundo escuro do carrinho. */
  classNameDe?: string;
};

export function PrecoDePor({ modelo, className = '', classNameDe = 'text-white/45' }: Props) {
  if (!emPromocao(modelo)) {
    return <span className={className}>{formatBRL(modelo.preco)}</span>;
  }
  return (
    <span className={`inline-flex flex-wrap items-baseline justify-end gap-x-2 ${className}`}>
      <span className="sr-only">de </span>
      <s className={`text-xs font-normal ${classNameDe}`} aria-hidden="true">
        {formatBRL(modelo.precoTabela as number)}
      </s>
      <span className="sr-only">
        {formatBRL(modelo.precoTabela as number)} por{' '}
      </span>
      <span>{formatBRL(modelo.preco)}</span>
    </span>
  );
}
