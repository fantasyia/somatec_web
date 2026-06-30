'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { RecipeProductsEditor } from '@/components/admin/RecipeProductsEditor';
import { IngredientsEditor } from '@/components/admin/IngredientsEditor';
import { InstructionsEditor } from '@/components/admin/InstructionsEditor';
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeInstruction } from '@/types/database';

type Props = { item?: Recipe; categories: Pick<RecipeCategory, 'id' | 'name'>[] };
const STATUS_OPTIONS = [{ value: 'published', label: 'Publicado' }, { value: 'draft', label: 'Rascunho' }];

export function ReceitaForm({ item, categories }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State-controlled — ingredients/instructions/linkedProducts vão direto pro PUT
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(item?.ingredients ?? []);
  const [instructions, setInstructions] = useState<RecipeInstruction[]>(item?.instructions ?? []);
  const [linkedProducts, setLinkedProducts] = useState<{ product_id: string; name: string }[]>([]);
  const linkedFetchRef = useRef(false);

  // Busca produtos já vinculados (B.3) pra alimentar o select de "produto MSM" em cada ingrediente
  useEffect(() => {
    if (!item || linkedFetchRef.current) return;
    linkedFetchRef.current = true;
    fetch(`/api/admin/receitas/${item.id}/produtos`)
      .then((res) => res.json())
      .then((data: { ok: boolean; items?: { product_id: string; name: string }[] }) => {
        if (data.ok && data.items) setLinkedProducts(data.items);
      })
      .catch(() => {});
  }, [item]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      id: item?.id,
      title: fd.get('title'),
      slug: fd.get('slug'),
      category_id: fd.get('category_id') || null,
      short_description: fd.get('short_description') || null,
      introduction: fd.get('introduction') || null,
      image_url: fd.get('image_url') || null,
      prep_time: fd.get('prep_time') || null,
      cook_time: fd.get('cook_time') || null,
      total_time: fd.get('total_time') || null,
      yield_text: fd.get('yield_text') || null,
      chef_notes: fd.get('chef_notes') || null,
      application_context: fd.get('application_context') || null,
      featured: fd.get('featured') === 'on',
      display_order: Number(fd.get('display_order')) || 0,
      status: fd.get('status'),
      ingredients,
      instructions,
    };
    const res = await fetch('/api/admin/receitas', { method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) {
      router.push('/admin/receitas');
      router.refresh();
    } else {
      setError(data.message ?? 'Erro.');
      setLoading(false);
    }
  }

  async function onDelete() {
    await fetch(`/api/admin/receitas?id=${item!.id}`, { method: 'DELETE' });
    router.push('/admin/receitas');
    router.refresh();
  }

  const categoryOptions = [{ value: '', label: '— sem categoria —' }, ...categories.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <form onSubmit={onSubmit} className="p-6 lg:p-8 max-w-3xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Título" name="title" required defaultValue={item?.title} />
        <AdminField label="Slug" name="slug" required defaultValue={item?.slug} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Categoria" name="category_id" options={categoryOptions} defaultValue={item?.category_id ?? ''} />
        <AdminField label="URL da imagem" name="image_url" defaultValue={item?.image_url ?? ''} />
      </div>
      <AdminField as="textarea" label="Descrição curta" name="short_description" rows={2} defaultValue={item?.short_description ?? ''} />
      <AdminField as="textarea" label="Introdução" name="introduction" rows={3} defaultValue={item?.introduction ?? ''} />
      <div className="grid grid-cols-3 gap-4">
        <AdminField label="Tempo de preparo" name="prep_time" defaultValue={item?.prep_time ?? ''} hint="Ex: 15 min" />
        <AdminField label="Tempo de cozimento" name="cook_time" defaultValue={item?.cook_time ?? ''} />
        <AdminField label="Tempo total" name="total_time" defaultValue={item?.total_time ?? ''} />
      </div>
      <AdminField label="Rendimento" name="yield_text" defaultValue={item?.yield_text ?? ''} hint="Ex: 4 porções" />
      <AdminField as="textarea" label="Notas do chef" name="chef_notes" rows={3} defaultValue={item?.chef_notes ?? ''} />
      <AdminField label="Contexto de aplicação" name="application_context" defaultValue={item?.application_context ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField as="select" label="Status" name="status" options={STATUS_OPTIONS} defaultValue={item?.status ?? 'draft'} required />
        <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))] cursor-pointer">
        <input type="checkbox" name="featured" defaultChecked={item?.featured ?? false} className="rounded border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
        Receita em destaque
      </label>

      {/* B.4 — Editor visual de ingredientes (sempre visível; persiste em jsonb no PUT) */}
      <IngredientsEditor value={ingredients} onChange={setIngredients} linkedProducts={linkedProducts} />

      {/* B.4 — Editor visual de instruções */}
      <InstructionsEditor value={instructions} onChange={setInstructions} />

      {/* B.3 — Vinculação de produtos MSM (só após criar a receita) */}
      {item && <RecipeProductsEditor recipeId={item.id} />}

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={loading} className="admin-btn-primary">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}{item ? 'Salvar' : 'Criar receita'}</button>
        {item && <DeleteButton onDelete={onDelete} label="Excluir receita" />}
      </div>
    </form>
  );
}
