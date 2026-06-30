'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import type { NavigationItem } from '@/types/database';

const LOCATION_OPTIONS = [
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'header_mega', label: 'Header — Mega menu' },
];

export function NavItemForm({ item }: { item?: NavigationItem }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      id: item?.id,
      label: fd.get('label'),
      href: fd.get('href'),
      location: fd.get('location'),
      display_order: Number(fd.get('display_order')) || 0,
      active: fd.get('active') === 'on',
      is_external: fd.get('is_external') === 'on',
      open_in_new_tab: fd.get('open_in_new_tab') === 'on',
    };
    const res = await fetch('/api/admin/navegacao', { method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { router.push('/admin/navegacao'); router.refresh(); }
    else { setError(data.message ?? 'Erro.'); setLoading(false); }
  }

  async function onDelete() {
    await fetch(`/api/admin/navegacao?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/navegacao');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Label" name="label" required defaultValue={item?.label} />
        <AdminField label="URL (href)" name="href" required defaultValue={item?.href} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Local" name="location" options={LOCATION_OPTIONS} required defaultValue={item?.location ?? 'header'} />
        <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      </div>
      <div className="flex gap-5">
        {['active', 'is_external', 'open_in_new_tab'].map((name) => (
          <label key={name} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input type="checkbox" name={name} defaultChecked={item ? (item as Record<string, unknown>)[name] as boolean : name === 'active'} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
            {name === 'active' ? 'Ativo' : name === 'is_external' ? 'Link externo' : 'Abrir em nova aba'}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}{item ? 'Salvar' : 'Criar'}</button>
        {item && <DeleteButton onDelete={onDelete} />}
      </div>
    </form>
  );
}
