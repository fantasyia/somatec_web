'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import type { Banner } from '@/types/database';

export function BannerForm({ item }: { item?: Banner }) {
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
      subtitle: fd.get('subtitle') || null,
      location: fd.get('location'),
      route_path: fd.get('route_path') || null,
      desktop_image_url: fd.get('desktop_image_url') || null,
      mobile_image_url: fd.get('mobile_image_url') || null,
      cta_label: fd.get('cta_label') || null,
      cta_url: fd.get('cta_url') || null,
      display_order: Number(fd.get('display_order')) || 0,
      active: fd.get('active') === 'on',
    };
    const res = await fetch('/api/admin/banners', {
      method: item ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { router.push('/admin/banners'); router.refresh(); }
    else { setError(data.message ?? 'Erro.'); setLoading(false); }
  }

  async function onDelete() {
    await fetch(`/api/admin/banners?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/banners');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-2xl space-y-5">
      <AdminField label="Título" name="title" required defaultValue={item?.title} />
      <AdminField label="Subtítulo" name="subtitle" defaultValue={item?.subtitle ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Local (location)" name="location" required defaultValue={item?.location} hint="Ex: home_hero, solucoes_top" />
        <AdminField label="Rota (route_path)" name="route_path" defaultValue={item?.route_path ?? ''} hint="Ex: /solucoes/food-service" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Imagem desktop" name="desktop_image_url" defaultValue={item?.desktop_image_url ?? ''} />
        <AdminField label="Imagem mobile" name="mobile_image_url" defaultValue={item?.mobile_image_url ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="CTA — label" name="cta_label" defaultValue={item?.cta_label ?? ''} />
        <AdminField label="CTA — URL" name="cta_url" defaultValue={item?.cta_url ?? ''} />
      </div>
      <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
        Ativo
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
          {item ? 'Salvar' : 'Criar banner'}
        </button>
        {item && <DeleteButton onDelete={onDelete} />}
      </div>
    </form>
  );
}
