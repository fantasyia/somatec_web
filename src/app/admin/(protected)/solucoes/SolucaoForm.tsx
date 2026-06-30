'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import type { Solution } from '@/types/database';

type Props = { item?: Solution };

const STATUS_OPTIONS = [
  { value: 'published', label: 'Publicado' },
  { value: 'draft', label: 'Rascunho' },
];

export function SolucaoForm({ item }: Props) {
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
      title: fd.get('title'),
      slug: fd.get('slug'),
      route_path: fd.get('route_path') || `/solucoes/${fd.get('slug')}`,
      short_description: fd.get('short_description') || null,
      cta_label: fd.get('cta_label') || null,
      cta_url: fd.get('cta_url') || null,
      form_interest_type: fd.get('form_interest_type') || null,
      hero_image_url: fd.get('hero_image_url') || null,
      display_order: Number(fd.get('display_order')) || 0,
      status: fd.get('status'),
    };
    const res = await fetch('/api/admin/solucoes', {
      method: item ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) {
      router.push('/admin/solucoes');
      router.refresh();
    } else {
      setError(data.message ?? 'Erro ao salvar.');
      setLoading(false);
    }
  }

  async function onDelete() {
    await fetch(`/api/admin/solucoes?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/solucoes');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-2xl space-y-5">
      <AdminField label="Título" name="title" required defaultValue={item?.title} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Slug" name="slug" required defaultValue={item?.slug} hint="Ex: food-service" />
        <AdminField label="Route path" name="route_path" defaultValue={item?.route_path} hint="Ex: /solucoes/food-service" />
      </div>
      <AdminField as="textarea" label="Descrição curta" name="short_description" rows={3} defaultValue={item?.short_description ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="CTA — label" name="cta_label" defaultValue={item?.cta_label ?? ''} />
        <AdminField label="CTA — URL" name="cta_url" defaultValue={item?.cta_url ?? ''} />
      </div>
      <AdminField label="Tipo de interesse do formulário" name="form_interest_type" defaultValue={item?.form_interest_type ?? ''} hint="Ex: food_service, b2b, envase" />
      <AdminField label="URL da imagem hero" name="hero_image_url" defaultValue={item?.hero_image_url ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Status" name="status" options={STATUS_OPTIONS} defaultValue={item?.status ?? 'draft'} required />
        <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
          {item ? 'Salvar alterações' : 'Criar solução'}
        </button>
        {item && <DeleteButton onDelete={onDelete} label="Excluir solução" />}
      </div>
    </form>
  );
}
