'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import type { Page } from '@/types/database';

const STATUS_OPTIONS = [{ value: 'published', label: 'Publicado' }, { value: 'draft', label: 'Rascunho' }];

export function PaginaForm({ item }: { item?: Page }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentJson, setContentJson] = useState(
    item?.content ? JSON.stringify(item.content, null, 2) : JSON.stringify({ sections: [] }, null, 2),
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let parsedContent;
    try {
      parsedContent = JSON.parse(contentJson);
    } catch {
      setError('JSON de conteúdo inválido.');
      setLoading(false);
      return;
    }

    const fd = new FormData(e.currentTarget);
    const body = {
      id: item?.id,
      title: fd.get('title'),
      slug: fd.get('slug'),
      route_path: fd.get('route_path'),
      page_type: fd.get('page_type') || 'institutional',
      hero_title: fd.get('hero_title') || null,
      hero_subtitle: fd.get('hero_subtitle') || null,
      hero_image_url: fd.get('hero_image_url') || null,
      seo_title: fd.get('seo_title') || null,
      seo_description: fd.get('seo_description') || null,
      robots_index: fd.get('robots_index') === 'on',
      robots_follow: fd.get('robots_follow') === 'on',
      status: fd.get('status'),
      content: parsedContent,
    };
    const res = await fetch('/api/admin/paginas', { method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { router.push('/admin/paginas'); router.refresh(); }
    else { setError(data.message ?? 'Erro.'); setLoading(false); }
  }

  async function onDelete() {
    await fetch(`/api/admin/paginas?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/paginas');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Título" name="title" required defaultValue={item?.title} />
        <AdminField label="Slug" name="slug" required defaultValue={item?.slug} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Rota" name="route_path" required defaultValue={item?.route_path} hint="Ex: /a-msm/quem-somos" />
        <AdminField label="Tipo" name="page_type" defaultValue={item?.page_type ?? 'institutional'} hint="institutional, solution, etc." />
      </div>
      <AdminField label="Hero — título" name="hero_title" defaultValue={item?.hero_title ?? ''} />
      <AdminField label="Hero — subtítulo" name="hero_subtitle" defaultValue={item?.hero_subtitle ?? ''} />
      <AdminField label="Hero — URL imagem" name="hero_image_url" defaultValue={item?.hero_image_url ?? ''} />
      <AdminField label="SEO title" name="seo_title" defaultValue={item?.seo_title ?? ''} />
      <AdminField as="textarea" label="SEO description" name="seo_description" rows={2} defaultValue={item?.seo_description ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Status" name="status" options={STATUS_OPTIONS} defaultValue={item?.status ?? 'draft'} required />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" name="robots_index" defaultChecked={item?.robots_index ?? false} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
          robots index
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" name="robots_follow" defaultChecked={item?.robots_follow ?? true} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
          robots follow
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-[0.07em] mb-1.5">
          Conteúdo (JSON de seções)
        </label>
        <textarea
          value={contentJson}
          onChange={(e) => setContentJson(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-white/12 bg-[rgb(var(--surface-elevated))] px-3.5 py-2.5 text-sm font-mono text-[rgb(var(--text))]/90 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 resize-y"
          spellCheck={false}
        />
        <p className="text-[11px] text-[rgb(var(--text-muted))]/60 mt-1">Estrutura: {'{"sections": [{"type": "text", ...}]}'}</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}{item ? 'Salvar' : 'Criar página'}</button>
        {item && <DeleteButton onDelete={onDelete} label="Excluir página" />}
      </div>
    </form>
  );
}
