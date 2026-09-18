import { User } from 'lucide-react';

// =============================================================================
// Avatar de quem assina — foto quando existe, INICIAIS quando não existe.
//
// Por que iniciais e não um rosto: o Fernando (José Fernando Nunes) revisa
// tecnicamente, assina com CREA, e pediu pra não ter o rosto no site. O caminho
// fácil seria retrato de banco de imagem ou gerado — e numa página sobre risco
// elétrico um rosto que não é de ninguém derruba a confiança na página inteira
// no dia em que alguém percebe. Iniciais não fingem ser ninguém: são um
// monograma, o leitor lê como identificação e não como retrato.
//
// ⚠️ REGRA DURA: o caminho sem foto NÃO pode conter <img>. É isso que separa
//    "esta pessoa não quis foto" de "inventamos uma pessoa".
//    Guarda em tests/eeat-autores.test.ts.
//
// Sem nome não há monograma — aí cai no ícone neutro, que é o fallback honesto
// de "não sabemos quem é" (o caso do perfil da redação, que não é uma pessoa).
// =============================================================================

/** Partículas não entram no monograma: "José Fernando Nunes" → JN, não JD. */
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'del', 'di']);

export function iniciaisDe(nome: string | null | undefined): string {
  const partes = (nome ?? '')
    .trim()
    .split(/\s+/)
    .filter((p) => p && !PARTICULAS.has(p.toLowerCase()));
  if (partes.length === 0) return '';
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
  return (primeira + ultima).toUpperCase();
}

type Tamanho = 'md' | 'lg';

const CAIXA: Record<Tamanho, string> = {
  md: 'h-14 w-14', // author box no fim do artigo
  lg: 'h-20 w-20', // topo da página /autor/<slug>
};

const TEXTO: Record<Tamanho, string> = {
  md: 'text-[17px]',
  lg: 'text-2xl',
};

const ICONE: Record<Tamanho, string> = {
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
};

export function AvatarAutor({
  nome,
  foto,
  tamanho = 'md',
}: {
  nome: string;
  foto?: string | null;
  tamanho?: Tamanho;
}) {
  const iniciais = iniciaisDe(nome);

  return (
    <div
      className={`flex ${CAIXA[tamanho]} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))]`}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={nome} className="h-full w-full object-cover" loading="lazy" />
      ) : iniciais ? (
        // aria-hidden porque o nome está escrito ao lado, em texto: um leitor
        // de tela anunciando "J N" antes do nome só atrapalha.
        <span
          className={`font-serif ${TEXTO[tamanho]} font-semibold tracking-[0.04em] text-cyan-text`}
          aria-hidden="true"
        >
          {iniciais}
        </span>
      ) : (
        <User
          className={`${ICONE[tamanho]} text-[rgb(var(--text-muted))]`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
