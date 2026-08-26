'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { normalizarNumero, numeroValido } from '@/lib/pedidos/tipos';

// =============================================================================
// Busca do pedido.
//
// A validação de formato acontece AQUI, antes de ir ao servidor: número
// digitado errado tem resposta imediata, e a maior parte da tentativa e erro
// nunca chega ao banco.
//
// O campo formata sozinho enquanto a pessoa digita — ela copia de um e-mail,
// digita minúsculo, esquece o hífen. Fazer o cliente acertar a pontuação de um
// código não é trabalho dele.
// =============================================================================

export function AcompanharPedido({ inicial = '' }: { inicial?: string }) {
  const router = useRouter();
  const [valor, setValor] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [indo, setIndo] = useState(false);

  function aoDigitar(bruto: string) {
    const limpo = bruto.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12);
    let formatado = limpo;
    if (limpo.length > 2) formatado = `${limpo.slice(0, 2)}-${limpo.slice(2)}`;
    if (limpo.length > 6) formatado = `${limpo.slice(0, 2)}-${limpo.slice(2, 6)}-${limpo.slice(6)}`;
    setValor(formatado);
    if (erro) setErro(null);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const numero = normalizarNumero(valor);
    if (!numeroValido(numero)) {
      setErro('Confira o número. Ele tem o formato SB-0000-XXXXXX e está no e-mail de confirmação do pedido.');
      return;
    }
    setIndo(true);
    router.push(`/pedido/${numero}`);
  }

  return (
    <form onSubmit={enviar} className="max-w-xl">
      <label htmlFor="numero-pedido" className="block font-sans text-sm font-semibold text-[rgb(var(--text))]">
        Número do pedido
      </label>
      <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
        Está no e-mail de confirmação, no formato <span className="font-semibold">SB-0000-XXXXXX</span>.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="numero-pedido"
          name="numero"
          value={valor}
          onChange={(e) => aoDigitar(e.target.value)}
          placeholder="SB-2608-K7M2QX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? 'erro-numero' : undefined}
          className="w-full rounded-btn border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3 font-sans text-lg tracking-wider text-[rgb(var(--text))] outline-none transition-colors placeholder:text-[rgb(var(--text-muted))] focus:border-cyan"
        />
        <button
          type="submit"
          disabled={indo}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-btn bg-cyan px-6 py-3 font-sans font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {indo ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          )}
          {indo ? 'Buscando…' : 'Acompanhar'}
        </button>
      </div>

      {erro && (
        <p id="erro-numero" role="alert" className="mt-3 text-sm font-medium text-[rgb(var(--text))]">
          {erro}
        </p>
      )}
    </form>
  );
}
