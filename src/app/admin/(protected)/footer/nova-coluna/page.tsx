'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { PageHeader } from '@/components/admin/PageHeader';

function FooterColumnForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/footer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: fd.get('title'), display_order: Number(fd.get('display_order')) || 0, active: fd.get('active') === 'on' }) });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { router.push('/admin/footer'); router.refresh(); } else { setError(data.message ?? 'Erro.'); setLoading(false); }
  }
  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-md space-y-5">
      <AdminField label="Título" name="title" required />
      <AdminField label="Ordem" name="display_order" type="number" defaultValue="0" />
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="active" defaultChecked className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" /> Ativo
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="admin-btn-primary">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}Criar coluna</button>
    </form>
  );
}

export default function NewFooterColumnPage() {
  return <div><PageHeader title="Nova Coluna do Footer" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Footer', href: '/admin/footer' }, { label: 'Nova Coluna' }]} /><FooterColumnForm /></div>;
}
