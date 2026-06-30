'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Search, X, Package, Loader2 } from 'lucide-react';

type LinkedProduct = {
  product_id: string;
  name: string;
  slug: string;
  main_image_url: string | null;
};

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  main_image_url: string | null;
};

type Props = {
  recipeId: string;
};

export function RecipeProductsEditor({ recipeId }: Props) {
  const [linked, setLinked] = useState<LinkedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const initialFetchRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    fetch(`/api/admin/receitas/${recipeId}/produtos`)
      .then((res) => res.json())
      .then((data: { ok: boolean; items?: LinkedProduct[]; message?: string }) => {
        if (data.ok && data.items) setLinked(data.items);
        else if (data.message) setError(data.message);
      })
      .catch(() => setError('Falha ao carregar produtos vinculados.'))
      .finally(() => setLoading(false));
  }, [recipeId]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      fetch(`/api/admin/produtos/search?q=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then((data: { ok: boolean; items?: SearchResult[] }) => {
          if (data.ok && data.items) setResults(data.items);
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Click outside fecha dropdown
  useEffect(() => {
    if (!showResults) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showResults]);

  async function linkProduct(product: SearchResult) {
    if (linked.some((l) => l.product_id === product.id)) {
      setShowResults(false);
      setSearch('');
      return;
    }
    const res = await fetch(`/api/admin/receitas/${recipeId}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id }),
    });
    const data = (await res.json()) as { ok: boolean; message?: string };
    if (data.ok) {
      setLinked((prev) => [
        ...prev,
        { product_id: product.id, name: product.name, slug: product.slug, main_image_url: product.main_image_url },
      ]);
      setSearch('');
      setShowResults(false);
    } else {
      setError(data.message ?? 'Falha ao vincular.');
    }
  }

  async function unlinkProduct(productId: string) {
    const res = await fetch(`/api/admin/receitas/${recipeId}/produtos?product_id=${productId}`, {
      method: 'DELETE',
    });
    const data = (await res.json()) as { ok: boolean; message?: string };
    if (data.ok) {
      setLinked((prev) => prev.filter((l) => l.product_id !== productId));
    } else {
      setError(data.message ?? 'Falha ao desvincular.');
    }
  }

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[rgb(var(--text))]">Produtos MSM usados nesta receita</h3>
        <p className="text-[11px] text-[rgb(var(--text-muted))]">
          Vincule os produtos do catálogo MSM que aparecem na receita. Esse vínculo alimenta os links dos ingredientes no site público.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Autocomplete */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-muted))]/60" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Buscar produto pelo nome…"
            className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] pl-9 pr-3 py-2 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:border-gold/60"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-muted))]/60 animate-spin" strokeWidth={2} />
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-lg">
            {results.map((p) => {
              const already = linked.some((l) => l.product_id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => linkProduct(p)}
                  disabled={already}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[rgb(var(--surface-elevated))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="relative h-8 w-8 flex-shrink-0 rounded bg-[rgb(var(--surface-elevated))] overflow-hidden">
                    {p.main_image_url ? (
                      <Image src={p.main_image_url} alt="" fill sizes="32px" className="object-cover" />
                    ) : (
                      <Package className="absolute inset-0 m-auto h-4 w-4 text-[rgb(var(--text-muted))]/60" strokeWidth={1.5} />
                    )}
                  </div>
                  <span className="text-sm text-[rgb(var(--text))] flex-1">{p.name}</span>
                  {already && <span className="text-[10px] uppercase tracking-widest text-gold">Vinculado</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de vinculados */}
      {loading ? (
        <p className="text-sm text-[rgb(var(--text-muted))]">Carregando vínculos…</p>
      ) : linked.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-muted))]/70 text-center py-4">
          Nenhum produto vinculado ainda. Use a busca acima.
        </p>
      ) : (
        <ul className="space-y-2">
          {linked.map((p) => (
            <li
              key={p.product_id}
              className="flex items-center gap-3 rounded-lg bg-[rgb(var(--surface-elevated))]/60 border border-[rgb(var(--border))] px-3 py-2 text-sm"
            >
              <div className="relative h-9 w-9 flex-shrink-0 rounded bg-[rgb(var(--surface-elevated))] overflow-hidden">
                {p.main_image_url ? (
                  <Image src={p.main_image_url} alt="" fill sizes="36px" className="object-cover" />
                ) : (
                  <Package className="absolute inset-0 m-auto h-4 w-4 text-[rgb(var(--text-muted))]/60" strokeWidth={1.5} />
                )}
              </div>
              <span className="flex-1 text-[rgb(var(--text))]">{p.name}</span>
              <button
                type="button"
                onClick={() => unlinkProduct(p.product_id)}
                aria-label={`Desvincular ${p.name}`}
                className="rounded-md p-1.5 text-[rgb(var(--text-muted))]/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
