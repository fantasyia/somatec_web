'use client';

import { GripVertical, Plus, Trash2 } from 'lucide-react';
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
import type { RecipeInstruction } from '@/types/database';

type Props = {
  value: RecipeInstruction[];
  onChange: (next: RecipeInstruction[]) => void;
};

// Identifier estável para DnD — usamos o número original do step antes da
// reordenação ser persistida. Como `step` pode duplicar durante edição,
// usamos índice do array no `id` (string).
type Sortable = RecipeInstruction & { _key: string };

function withKeys(items: RecipeInstruction[]): Sortable[] {
  return items.map((it, idx) => ({ ...it, _key: `step-${idx}-${it.step}` }));
}

export function InstructionsEditor({ value, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function add() {
    onChange([...value, { step: value.length + 1, text: '', image_url: null, tip: null }]);
  }

  function update(index: number, patch: Partial<RecipeInstruction>) {
    onChange(value.map((ins, i) => (i === index ? { ...ins, ...patch } : ins)));
  }

  function remove(index: number) {
    // Após remover, renumera os steps sequencialmente
    onChange(value.filter((_, i) => i !== index).map((ins, i) => ({ ...ins, step: i + 1 })));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const keyed = withKeys(value);
    const oldIndex = keyed.findIndex((it) => it._key === active.id);
    const newIndex = keyed.findIndex((it) => it._key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(keyed, oldIndex, newIndex)
      .map(({ _key, ...rest }, i) => {
        void _key;
        return { ...rest, step: i + 1 };
      });
    onChange(reordered);
  }

  const keyed = withKeys(value);

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text))]">Instruções de preparo</h3>
          <p className="text-[11px] text-[rgb(var(--text-muted))]">
            Passos numerados automaticamente. Arraste pra reordenar — a numeração se ajusta.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="admin-btn-primary inline-flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Adicionar passo
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-muted))]/70 text-center py-4">
          Nenhum passo. Clique em &quot;Adicionar passo&quot; pra começar.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={keyed.map((it) => it._key)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {keyed.map((ins, index) => (
                <SortableInstruction
                  key={ins._key}
                  dndId={ins._key}
                  instruction={ins}
                  onUpdate={(patch) => update(index, patch)}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableInstruction({
  dndId,
  instruction,
  onUpdate,
  onRemove,
}: {
  dndId: string;
  instruction: RecipeInstruction;
  onUpdate: (patch: Partial<RecipeInstruction>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dndId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_2.5rem_1fr_auto] gap-2 items-start rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))]/40 p-2.5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arraste para reordenar"
        className="self-stretch flex items-center justify-center text-[rgb(var(--text-muted))]/60 hover:text-[rgb(var(--text))] cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <div className="self-start mt-1 h-7 w-7 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold text-xs font-semibold">
        {instruction.step}
      </div>
      <div className="space-y-1.5">
        <label className="block">
          <span className="block text-[9px] uppercase tracking-widest text-[rgb(var(--text-muted))]/70 mb-0.5">Texto do passo</span>
          <textarea
            value={instruction.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            rows={2}
            placeholder="Ex: Em uma tigela, misture os ingredientes secos até ficar homogêneo."
            className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-1.5 text-xs text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:border-gold/60 resize-y"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[9px] uppercase tracking-widest text-[rgb(var(--text-muted))]/70 mb-0.5">Imagem (URL, opcional)</span>
            <input
              type="text"
              value={instruction.image_url ?? ''}
              onChange={(e) => onUpdate({ image_url: e.target.value || null })}
              placeholder="https://..."
              className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-1 text-xs text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:border-gold/60"
            />
          </label>
          <label className="block">
            <span className="block text-[9px] uppercase tracking-widest text-[rgb(var(--text-muted))]/70 mb-0.5">Dica (opcional)</span>
            <input
              type="text"
              value={instruction.tip ?? ''}
              onChange={(e) => onUpdate({ tip: e.target.value || null })}
              placeholder="Ex: deixe descansar antes de modelar"
              className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-1 text-xs text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:border-gold/60"
            />
          </label>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover passo"
        className="self-start rounded-md p-1.5 text-[rgb(var(--text-muted))]/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
