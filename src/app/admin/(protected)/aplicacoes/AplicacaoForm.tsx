'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import type { ProductApplication } from '@/types/database';

const STATUS_OPTIONS = [{ value: 'published', label: 'Publicado' }, { value: 'draft', label: 'Rascunho' }];

export function AplicacaoForm({ item }: { item?: ProductApplication }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = { id: item?.id, name: fd.get('name'), slug: fd.get('slug'), description: fd.get('description') || null, image_url: fd.get('image_url') || null, display_order: Number(fd.get('display_order')) || 0, status: fd.get('status') };
    const res = await fetch('/api/admin/aplicacoes', { method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { router.push('/admin/aplicacoes'); router.refresh(); }
    else { setError(data.message ?? 'Erro.'); setLoading(false); }
  }

  async function onDelete() {
    await fetch(`/api/admin/aplicacoes?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/aplicacoes');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Nome" name="name" required defaultValue={item?.name} />
        <AdminField label="Slug" name="slug" required defaultValue={item?.slug} />
      </div>
      <AdminField as="textarea" label="Descrição" name="description" rows={2} defaultValue={item?.description ?? ''} />
      <AdminField label="URL da imagem" name="image_url" defaultValue={item?.image_url ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Status" name="status" options={STATUS_OPTIONS} defaultValue={item?.status ?? 'draft'} required />
        <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}{item ? 'Salvar' : 'Criar'}</button>
        {item && <DeleteButton onDelete={onDelete} />}
      </div>
    </form>
  );
}
