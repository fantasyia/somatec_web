'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

type Props = {
  onDelete: () => Promise<void>;
  label?: string;
};

export function DeleteButton({ onDelete, label = 'Excluir' }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-red-400">{err ?? 'Confirmar?'}</span>
        <button
          onClick={async () => {
            setLoading(true);
            setErr(null);
            try {
              await onDelete();
            } catch {
              // Sem try/finally o spinner ficava travado para sempre quando o
              // delete falhava (ex.: rede caiu / 503 após mutação).
              setErr('Falha ao excluir.');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> : 'Sim'}
        </button>
        <button
          onClick={() => { setConfirming(false); setErr(null); }}
          className="text-xs text-[rgb(var(--text-muted))]/80 hover:text-white/70"
        >
          Não
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[rgb(var(--text-muted))]/80 hover:text-red-400 hover:bg-red-900/20 transition-colors"
      title={label}
    >
      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
      {label}
    </button>
  );
}
