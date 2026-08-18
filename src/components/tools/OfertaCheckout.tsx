'use client';

import { useEffect, useState } from 'react';
import { Truck, Gift, Timer } from 'lucide-react';

// =============================================================================
// Oferta do checkout NI: frete grátis + brinde exclusivo pra quem fechar dentro
// da janela. Só na trilha de COMPRA DIRETA — a industrial é locação.
//
// A janela é de 20 min e o início fica em sessionStorage: recarregar a página
// NÃO reinicia o relógio. Se reiniciasse, o mesmo visitante veria prazos
// diferentes e a contagem viraria enfeite — o oposto do que ela existe pra
// fazer. Ao zerar, o brinde some e o frete grátis (que não depende do prazo)
// continua.
// =============================================================================

const JANELA_MIN = 20;
const CHAVE = 'stc_oferta_checkout';

function inicio(): number {
  if (typeof window === 'undefined') return Date.now();
  const salvo = Number(window.sessionStorage.getItem(CHAVE));
  if (salvo && Number.isFinite(salvo)) return salvo;
  const agora = Date.now();
  try {
    window.sessionStorage.setItem(CHAVE, String(agora));
  } catch {
    /* modo privado / storage bloqueado — só não persiste */
  }
  return agora;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

export function OfertaCheckout() {
  const [restante, setRestante] = useState<number | null>(null);

  useEffect(() => {
    const fim = inicio() + JANELA_MIN * 60_000;
    const tick = () => setRestante(Math.max(0, fim - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Antes do 1º tick não renderiza contagem — evita o servidor mandar um número
  // e o cliente trocar por outro (hydration mismatch).
  const noPrazo = restante === null || restante > 0;
  const min = Math.floor((restante ?? 0) / 60_000);
  const seg = Math.floor(((restante ?? 0) % 60_000) / 1000);

  return (
    <div className="rounded-card border border-gold/40 bg-gold/[0.07] p-4">
      <ul className="space-y-2.5">
        <li className="flex items-center gap-2.5 text-sm text-[rgb(var(--text))]">
          <Truck className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} aria-hidden="true" />
          <span><span className="font-semibold">Frete grátis</span> para todo o Brasil.</span>
        </li>
        {noPrazo && (
          <li className="flex items-center gap-2.5 text-sm text-[rgb(var(--text))]">
            <Gift className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} aria-hidden="true" />
            <span>
              <span className="font-semibold">Brinde exclusivo</span> para quem fechar nos próximos{' '}
              {restante === null ? (
                <span className="font-semibold tabular-nums">{JANELA_MIN} minutos</span>
              ) : (
                <time
                  className="font-semibold tabular-nums text-gold"
                  aria-live="off"
                  dateTime={`PT${min}M${seg}S`}
                >
                  {doisDigitos(min)}:{doisDigitos(seg)}
                </time>
              )}
              .
            </span>
          </li>
        )}
      </ul>
      {noPrazo && restante !== null && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
          <Timer className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          O contador segue de onde parou se você recarregar a página.
        </p>
      )}
    </div>
  );
}
