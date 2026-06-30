'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Loader2 } from 'lucide-react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ItemBase = { id: string };

type ReorderTable =
  | 'home_slider_items'
  | 'home_indicators'
  | 'home_cta_cards'
  | 'banners'
  | 'navigation_items'
  | 'footer_links'
  | 'footer_columns';

type Props<T extends ItemBase> = {
  /** Itens já ordenados por display_order. */
  initial: T[];
  /** Nome da tabela alvo no Postgres (whitelist da API). */
  table: ReorderTable;
  /** Renderiza o conteúdo de cada linha (a grip handle e o wrapper já são renderizados). */
  renderItem: (item: T) => ReactNode;
  /** Mensagem quando lista vazia. */
  empty?: string;
  /** Quando true, recarrega o server component após salvar (pra refletir display_order). */
  refreshOnSave?: boolean;
};

export function SortableAdminList<T extends ItemBase>({
  initial,
  table,
  renderItem,
  empty = 'Nada cadastrado.',
  refreshOnSave = false,
}: Props<T>) {
  const router = useRouter();
  const [items, setItems] = useState<T[]>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, order: reordered.map((it) => it.id) }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!data.ok) {
        setError(data.message ?? 'Falha ao salvar ordem.');
        // reverte UI
        setItems(items);
      } else if (refreshOnSave) {
        router.refresh();
      }
    } catch {
      setError('Falha de rede.');
      setItems(items);
    } finally {
      setSaving(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-[rgb(var(--text-muted))]/60 py-8 text-center">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {saving && (
        <p className="text-[11px] text-[rgb(var(--text-muted))] flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
          Salvando ordem…
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableRow key={item.id} id={item.id}>
                {renderItem(item)}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 px-3 py-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arraste para reordenar"
        className="text-[rgb(var(--text-muted))]/60 hover:text-[rgb(var(--text))] cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-3">{children}</div>
    </div>
  );
}
