'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import type { Redirect } from '@/types/database';

const CODE_OPTIONS = [
  { value: '301', label: '301 — Permanente' },
  { value: '302', label: '302 — Temporário' },
  { value: '307', label: '307 — Temporário (method-safe)' },
  { value: '308', label: '308 — Permanente (method-safe)' },
];

export function RedirectForm({ item }: { item?: Redirect }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = { id: item?.id, from_path: fd.get('from_path'), to_path: fd.get('to_path'), status_code: Number(fd.get('status_code')) || 301, active: fd.get('active') === 'on', notes: fd.get('notes') || null };
    const res = await fetch('/api/admin/redirects', { method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { router.push('/admin/redirects'); router.refresh(); } else { setError(data.message ?? 'Erro.'); setLoading(false); }
  }

  async function onDelete() {
    await fetch(`/api/admin/redirects?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/redirects');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-xl space-y-5">
      <AdminField label="De (from_path)" name="from_path" required defaultValue={item?.from_path} hint="Ex: /antigo-caminho" />
      <AdminField label="Para (to_path)" name="to_path" required defaultValue={item?.to_path} hint="Ex: /novo-caminho ou URL absoluta" />
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Código HTTP" name="status_code" options={CODE_OPTIONS} defaultValue={String(item?.status_code ?? 301)} required />
      </div>
      <AdminField label="Notas (interno)" name="notes" defaultValue={item?.notes ?? ''} />
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" /> Ativo
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}{item ? 'Salvar' : 'Criar redirect'}</button>
        {item && <DeleteButton onDelete={onDelete} />}
      </div>
    </form>
  );
}
