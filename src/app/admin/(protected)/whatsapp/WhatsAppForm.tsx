'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ExternalLink } from 'lucide-react';
import type { WhatsAppButtonConfig } from '@/lib/whatsapp-button';

type Props = {
  initial: WhatsAppButtonConfig;
  updatedAt: string | null;
};

export function WhatsAppForm({ initial, updatedAt }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [number, setNumber] = useState(initial.number);
  const [message, setMessage] = useState(initial.message);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sanitiza enquanto digita (mantém só dígitos)
  function handleNumberChange(v: string) {
    setNumber(v.replace(/\D/g, '').slice(0, 15));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, number, message }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setError(json.message ?? `Erro ${res.status}`);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede');
    } finally {
      setLoading(false);
    }
  }

  const previewUrl =
    enabled && number
      ? `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`
      : null;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Enabled toggle */}
      <div className="rounded-card border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))]/40 p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-gold focus:ring-gold/50 focus:ring-offset-0"
          />
          <div className="flex-1">
            <span className="block text-sm font-semibold text-[rgb(var(--text))]">
              Exibir botão WhatsApp no site
            </span>
            <span className="block text-xs text-[rgb(var(--text-muted))] mt-0.5">
              Quando desativado, o botão flutuante não aparece em nenhuma página pública.
            </span>
          </div>
        </label>
      </div>

      {/* Number */}
      <div>
        <label htmlFor="wa-number" className="block text-sm font-semibold text-[rgb(var(--text))] mb-1.5">
          Número do WhatsApp
        </label>
        <input
          id="wa-number"
          type="text"
          inputMode="numeric"
          value={number}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder="5511999998888"
          className="w-full px-3 py-2 rounded-btn bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--text))] text-sm focus:outline-none focus:border-gold transition-colors"
        />
        <p className="text-xs text-[rgb(var(--text-muted))]/80 mt-1.5">
          Formato internacional <strong>sem</strong> +, espaços ou hífens. Ex: <code className="text-gold">5511999998888</code> (55 = Brasil, 11 = DDD).
        </p>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="wa-message" className="block text-sm font-semibold text-[rgb(var(--text))] mb-1.5">
          Mensagem pré-preenchida
        </label>
        <textarea
          id="wa-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 500))}
          placeholder="Olá! Vim pelo site da MSM..."
          className="w-full px-3 py-2 rounded-btn bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--text))] text-sm focus:outline-none focus:border-gold transition-colors resize-y"
        />
        <div className="flex justify-between text-xs text-[rgb(var(--text-muted))]/80 mt-1.5">
          <span>Aparece já digitada na conversa quando o cliente clica no botão.</span>
          <span>{message.length}/500</span>
        </div>
      </div>

      {/* Preview link */}
      {previewUrl && (
        <div className="rounded-card border border-gold/30 bg-gold/[0.04] p-4">
          <p className="text-xs uppercase tracking-widest font-semibold text-gold mb-2">
            Pré-visualização
          </p>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--text))] hover:text-gold transition-colors break-all"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
            {previewUrl}
          </a>
          <p className="text-xs text-[rgb(var(--text-muted))]/80 mt-2">
            Clique acima para abrir o WhatsApp como o cliente verá.
          </p>
        </div>
      )}

      {/* Feedback */}
      {error && (
        <div className="rounded-btn border border-red-500/30 bg-red-500/[0.06] px-4 py-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      {saved && !error && (
        <div className="rounded-btn border border-green-500/30 bg-green-500/[0.06] px-4 py-3">
          <p className="text-sm text-green-300">Configuração salva. Mudança aparece no site em alguns segundos.</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))]/60">
        <span className="text-xs text-[rgb(var(--text-muted))]/60">
          {updatedAt
            ? `Última edição: ${new Date(updatedAt).toLocaleString('pt-BR')}`
            : 'Nunca salvo'}
        </span>
        <button
          type="submit"
          disabled={loading}
          className="admin-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Save className="h-4 w-4" strokeWidth={2} />
          )}
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
