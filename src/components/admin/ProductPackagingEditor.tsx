'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import type { ProductPackagingOption } from '@/types/database';

type Packaging = Pick<
  ProductPackagingOption,
  'id' | 'label' | 'description' | 'weight_or_volume' | 'weight_grams' | 'units_per_box' | 'is_primary' | 'active' | 'display_order'
>;

type Props = {
  productId: string;
};

const EMPTY_DRAFT = {
  label: '',
  description: '',
  weight_or_volume: '',
  weight_grams: '',
  units_per_box: '',
  is_primary: false,
  active: true,
};

export function ProductPackagingEditor({ productId }: Props) {
  const [items, setItems] = useState<Packaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const initialFetchRef = useRef(false);

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    fetch(`/api/admin/produtos/${productId}/embalagens`)
      .then((res) => res.json())
      .then((data: { ok: boolean; items?: Packaging[]; message?: string }) => {
        if (data.ok && data.items) setItems(data.items);
        else if (data.message) setError(data.message);
      })
      .catch(() => setError('Falha ao carregar embalagens.'))
      .finally(() => setLoading(false));
  }, [productId]);

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.label.trim()) {
      setError('Rótulo é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      label: draft.label.trim(),
      description: draft.description.trim() || null,
      weight_or_volume: draft.weight_or_volume.trim() || null,
      weight_grams: draft.weight_grams ? Number(draft.weight_grams) : null,
      units_per_box: draft.units_per_box.trim() || null,
      is_primary: draft.is_primary,
      active: draft.active,
    };
    const res = await fetch(`/api/admin/produtos/${productId}/embalagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; item?: Packaging; message?: string };
    setSaving(false);
    if (data.ok && data.item) {
      setItems((prev) => [...prev, data.item!]);
      setDraft(EMPTY_DRAFT);
    } else {
      setError(data.message ?? 'Falha ao adicionar.');
    }
  }

  async function onUpdate(id: string, patch: Partial<Packaging>) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await fetch(`/api/admin/produtos/${productId}/embalagens`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
  }

  async function onRemove(id: string) {
    if (!confirm('Remover esta embalagem?')) return;
    const res = await fetch(`/api/admin/produtos/${productId}/embalagens?option_id=${id}`, { method: 'DELETE' });
    const data = (await res.json()) as { ok: boolean; message?: string };
    if (data.ok) {
      setItems((prev) => prev.filter((p) => p.id !== id));
    } else {
      setError(data.message ?? 'Falha ao remover.');
    }
  }

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-[rgb(var(--text))]">Embalagens disponíveis</h3>
        <p className="text-[11px] text-[rgb(var(--text-muted))]">
          Cadastre cada formato (label obrigatório). &quot;Principal&quot; destaca a embalagem default exibida ao cliente.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Lista existente */}
      {loading ? (
        <p className="text-sm text-[rgb(var(--text-muted))]">Carregando embalagens…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-muted))]/70 text-center py-4">
          Nenhuma embalagem cadastrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <PackagingRow
              key={p.id}
              item={p}
              onUpdate={(patch) => onUpdate(p.id, patch)}
              onRemove={() => onRemove(p.id)}
            />
          ))}
        </div>
      )}

      {/* Form de adição */}
      <form onSubmit={onAdd} className="rounded-lg border border-dashed border-[rgb(var(--border))] p-4 space-y-3">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-[rgb(var(--text-muted))]/80">
          Adicionar nova embalagem
        </p>
        <div className="grid grid-cols-2 gap-3">
          <PackInput
            label="Rótulo *"
            value={draft.label}
            onChange={(v) => setDraft({ ...draft, label: v })}
            placeholder="Ex: Pouch 2kg"
          />
          <PackInput
            label="Peso/volume (display)"
            value={draft.weight_or_volume}
            onChange={(v) => setDraft({ ...draft, weight_or_volume: v })}
            placeholder="Ex: 2 kg · 5L"
          />
        </div>
        <PackInput
          label="Descrição"
          value={draft.description}
          onChange={(v) => setDraft({ ...draft, description: v })}
          placeholder="Detalhes adicionais (opcional)"
        />
        <div className="grid grid-cols-2 gap-3">
          <PackInput
            label="Peso (gramas, numérico)"
            type="number"
            value={draft.weight_grams}
            onChange={(v) => setDraft({ ...draft, weight_grams: v })}
            placeholder="2000"
          />
          <PackInput
            label="Unidades por caixa"
            value={draft.units_per_box}
            onChange={(v) => setDraft({ ...draft, units_per_box: v })}
            placeholder="Ex: 6 un · 12un"
          />
        </div>
        <div className="flex items-center gap-5 pt-1">
          <PackToggle
            label="Principal"
            checked={draft.is_primary}
            onChange={(v) => setDraft({ ...draft, is_primary: v })}
          />
          <PackToggle
            label="Ativo"
            checked={draft.active}
            onChange={(v) => setDraft({ ...draft, active: v })}
          />
          <button
            type="submit"
            disabled={saving}
            className="admin-btn-primary ml-auto inline-flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
            Adicionar
          </button>
        </div>
      </form>
    </div>
  );
}

function PackagingRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: Packaging;
  onUpdate: (patch: Partial<Packaging>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    label: item.label,
    description: item.description ?? '',
    weight_or_volume: item.weight_or_volume ?? '',
    weight_grams: item.weight_grams != null ? String(item.weight_grams) : '',
    units_per_box: item.units_per_box ?? '',
    is_primary: item.is_primary,
    active: item.active,
  });

  function save() {
    onUpdate({
      label: draft.label,
      description: draft.description || null,
      weight_or_volume: draft.weight_or_volume || null,
      weight_grams: draft.weight_grams ? Number(draft.weight_grams) : null,
      units_per_box: draft.units_per_box || null,
      is_primary: draft.is_primary,
      active: draft.active,
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-[rgb(var(--surface-elevated))]/60 border border-[rgb(var(--border))] px-3 py-2.5 text-sm">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 text-left hover:text-gold transition-colors"
        >
          <span className="font-medium text-[rgb(var(--text))]">{item.label}</span>
          {item.weight_or_volume && <span className="text-[rgb(var(--text-muted))] ml-2">· {item.weight_or_volume}</span>}
          {item.units_per_box && <span className="text-[rgb(var(--text-muted))] ml-2">· {item.units_per_box}</span>}
          {item.is_primary && <span className="ml-2 text-[10px] uppercase tracking-widest text-gold font-semibold">Principal</span>}
          {!item.active && <span className="ml-2 text-[10px] uppercase tracking-widest text-red-400/80 font-semibold">Inativo</span>}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover embalagem"
          className="rounded-md p-1.5 text-[rgb(var(--text-muted))]/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[rgb(var(--surface-elevated))]/60 border border-gold/40 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <PackInput label="Rótulo" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} />
        <PackInput label="Peso/volume" value={draft.weight_or_volume} onChange={(v) => setDraft({ ...draft, weight_or_volume: v })} />
      </div>
      <PackInput label="Descrição" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />
      <div className="grid grid-cols-2 gap-2">
        <PackInput label="Peso (g)" type="number" value={draft.weight_grams} onChange={(v) => setDraft({ ...draft, weight_grams: v })} />
        <PackInput label="Unidades/caixa" value={draft.units_per_box} onChange={(v) => setDraft({ ...draft, units_per_box: v })} />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <PackToggle label="Principal" checked={draft.is_primary} onChange={(v) => setDraft({ ...draft, is_primary: v })} />
        <PackToggle label="Ativo" checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
        <button type="button" onClick={save} className="ml-auto admin-btn-primary inline-flex items-center gap-1.5 text-xs px-3 py-1.5">
          <Save className="h-3 w-3" strokeWidth={2} /> Salvar
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function PackInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-[rgb(var(--text-muted))]/80 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-2.5 py-1.5 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:border-gold/60"
      />
    </label>
  );
}

function PackToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[rgb(var(--text-muted))]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40"
      />
      {label}
    </label>
  );
}
