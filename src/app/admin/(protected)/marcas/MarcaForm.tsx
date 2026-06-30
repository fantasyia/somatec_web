'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import type { Brand } from '@/types/database';

const STATUS_OPTIONS = [{ value: 'published', label: 'Publicado' }, { value: 'draft', label: 'Rascunho' }];

export function MarcaForm({ item }: { item?: Brand }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      id: item?.id,
      name: fd.get('name'),
      slug: fd.get('slug'),
      short_description: fd.get('short_description') || null,
      full_description: fd.get('full_description') || null,
      logo_url: fd.get('logo_url') || null,
      cover_image_url: fd.get('cover_image_url') || null,
      positioning: fd.get('positioning') || null,
      target_audience: fd.get('target_audience') || null,
      featured: fd.get('featured') === 'on',
      display_order: Number(fd.get('display_order')) || 0,
      status: fd.get('status'),
    };
    const res = await fetch('/api/admin/marcas', {
      method: item ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { router.push('/admin/marcas'); router.refresh(); }
    else { setError(data.message ?? 'Erro.'); setLoading(false); }
  }

  async function onDelete() {
    await fetch(`/api/admin/marcas?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/marcas');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Nome" name="name" required defaultValue={item?.name} />
        <AdminField label="Slug" name="slug" required defaultValue={item?.slug} />
      </div>
      <AdminField as="textarea" label="Descrição curta" name="short_description" rows={2} defaultValue={item?.short_description ?? ''} />
      <AdminField as="textarea" label="Descrição completa" name="full_description" rows={4} defaultValue={item?.full_description ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="URL do logo" name="logo_url" defaultValue={item?.logo_url ?? ''} />
        <AdminField label="URL da imagem de capa" name="cover_image_url" defaultValue={item?.cover_image_url ?? ''} />
      </div>
      <AdminField label="Posicionamento" name="positioning" defaultValue={item?.positioning ?? ''} />
      <AdminField label="Público-alvo" name="target_audience" defaultValue={item?.target_audience ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Status" name="status" options={STATUS_OPTIONS} defaultValue={item?.status ?? 'draft'} required />
        <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="featured" defaultChecked={item?.featured ?? false} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
        Destacar na home
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
          {item ? 'Salvar' : 'Criar marca'}
        </button>
        {item && <DeleteButton onDelete={onDelete} label="Excluir marca" />}
      </div>
    </form>
  );
}
