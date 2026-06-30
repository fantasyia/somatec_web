'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { ProductGalleryEditor } from '@/components/admin/ProductGalleryEditor';
import { ProductPackagingEditor } from '@/components/admin/ProductPackagingEditor';
import type { Product, Brand, ProductCategory } from '@/types/database';

type Props = { item?: Product; brands: Pick<Brand, 'id' | 'name'>[]; categories: Pick<ProductCategory, 'id' | 'name'>[] };

const STATUS_OPTIONS = [{ value: 'published', label: 'Publicado' }, { value: 'draft', label: 'Rascunho' }];

export function ProdutoForm({ item, brands, categories }: Props) {
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
      brand_id: fd.get('brand_id') || null,
      category_id: fd.get('category_id') || null,
      short_description: fd.get('short_description') || null,
      full_description: fd.get('full_description') || null,
      main_image_url: fd.get('main_image_url') || null,
      technical_sheet_url: fd.get('technical_sheet_url') || null,
      packaging_summary: fd.get('packaging_summary') || null,
      commercial_notes: fd.get('commercial_notes') || null,
      featured: fd.get('featured') === 'on',
      display_order: Number(fd.get('display_order')) || 0,
      status: fd.get('status'),
    };
    const res = await fetch('/api/admin/produtos', { method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { router.push('/admin/produtos'); router.refresh(); }
    else { setError(data.message ?? 'Erro.'); setLoading(false); }
  }

  async function onDelete() {
    await fetch(`/api/admin/produtos?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/produtos');
    router.refresh();
  }

  const brandOptions = [{ value: '', label: '— sem marca —' }, ...brands.map((b) => ({ value: b.id, label: b.name }))];
  const categoryOptions = [{ value: '', label: '— sem categoria —' }, ...categories.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-3xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Nome" name="name" required defaultValue={item?.name} />
        <AdminField label="Slug" name="slug" required defaultValue={item?.slug} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Marca" name="brand_id" options={brandOptions} defaultValue={item?.brand_id ?? ''} />
        <AdminField as="select" label="Categoria" name="category_id" options={categoryOptions} defaultValue={item?.category_id ?? ''} />
      </div>
      <AdminField as="textarea" label="Descrição curta" name="short_description" rows={2} defaultValue={item?.short_description ?? ''} />
      <AdminField as="textarea" label="Descrição completa" name="full_description" rows={4} defaultValue={item?.full_description ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="URL da imagem principal" name="main_image_url" defaultValue={item?.main_image_url ?? ''} />
        <AdminField label="URL da ficha técnica" name="technical_sheet_url" defaultValue={item?.technical_sheet_url ?? ''} />
      </div>
      <AdminField label="Resumo de embalagens" name="packaging_summary" defaultValue={item?.packaging_summary ?? ''} hint="Ex: Sachê 7g, Bisnaga 400g, Balde 3kg" />
      <AdminField as="textarea" label="Notas comerciais (interno)" name="commercial_notes" rows={2} defaultValue={item?.commercial_notes ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Status" name="status" options={STATUS_OPTIONS} defaultValue={item?.status ?? 'draft'} required />
        <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="featured" defaultChecked={item?.featured ?? false} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
        Produto em destaque
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}{item ? 'Salvar' : 'Criar produto'}</button>
        {item && <DeleteButton onDelete={onDelete} label="Excluir produto" />}
      </div>

      {/* Sub-editores (B.1 + B.2) — só aparecem após criar o produto (precisam do id) */}
      {item && (
        <div className="pt-4 space-y-5">
          <ProductGalleryEditor productId={item.id} />
          <ProductPackagingEditor productId={item.id} />
        </div>
      )}
    </form>
  );
}
