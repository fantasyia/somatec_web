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
import type { RecipeIngredient } from '@/types/database';

type Props = {
  value: RecipeIngredient[];
  onChange: (next: RecipeIngredient[]) => void;
  /** Produtos MSM já vinculados à receita (via recipe_products) — permitidos para link. */
  linkedProducts?: { product_id: string; name: string }[];
};

// Unidades comuns em receitas profissionais (PT-BR). Pode estender depois.
const UNITS = [
  'g',
  'kg',
  'mg',
  'ml',
  'l',
  'xícara',
  'colher de sopa',
  'colher de chá',
  'colher de café',
  'pitada',
  'dente',
  'fatia',
  'unidade',
  'a gosto',
];

function newId() {
  // browser-only (este componente é client). UUID v4 nativo.
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `ing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function IngredientsEditor({ value, onChange, linkedProducts }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function add() {
    onChange([
      ...value,
      { id: newId(), name: '', quantity: '', unit: UNITS[0]!, notes: null, product_id: null },
    ]);
  }

  function update(id: string, patch: Partial<RecipeIngredient>) {
    onChange(value.map((ing) => (ing.id === id ? { ...ing, ...patch } : ing)));
  }

  function remove(id: string) {
    onChange(value.filter((ing) => ing.id !== id));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((ing) => ing.id === active.id);
    const newIndex = value.findIndex((ing) => ing.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text))]">Ingredientes</h3>
          <p className="text-[11px] text-[rgb(var(--text-muted))]">
            Arraste pra reordenar. Vincule a um produto MSM pra criar o link no site público.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="admin-btn-primary inline-flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Adicionar ingrediente
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-muted))]/70 text-center py-4">
          Nenhum ingrediente. Clique em &quot;Adicionar ingrediente&quot; pra começar.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={value.map((ing) => ing.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {value.map((ing) => (
                <SortableIngredient
                  key={ing.id}
                  ingredient={ing}
                  linkedProducts={linkedProducts ?? []}
                  onUpdate={(patch) => update(ing.id, patch)}
                  onRemove={() => remove(ing.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableIngredient({
  ingredient,
  linkedProducts,
  onUpdate,
  onRemove,
}: {
  ingredient: RecipeIngredient;
  linkedProducts: { product_id: string; name: string }[];
  onUpdate: (patch: Partial<RecipeIngredient>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ingredient.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-start rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))]/40 p-2.5"
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

      <div className="space-y-1.5">
        <div className="grid grid-cols-[1fr_5rem_8rem] gap-2">
          <FieldInput
            label="Nome"
            value={ingredient.name}
            onChange={(v) => onUpdate({ name: v })}
            placeholder="Ex: Farinha de trigo"
          />
          <FieldInput
            label="Qtd."
            value={ingredient.quantity}
            onChange={(v) => onUpdate({ quantity: v })}
            placeholder="500"
          />
          <FieldSelect
            label="Unidade"
            value={ingredient.unit}
            onChange={(v) => onUpdate({ unit: v })}
            options={UNITS}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FieldInput
            label="Observação (opcional)"
            value={ingredient.notes ?? ''}
            onChange={(v) => onUpdate({ notes: v || null })}
            placeholder="Ex: peneirada · temperatura ambiente"
          />
          {linkedProducts.length > 0 && (
            <FieldSelect
              label="Produto MSM vinculado"
              value={ingredient.product_id ?? ''}
              onChange={(v) => onUpdate({ product_id: v || null })}
              options={['', ...linkedProducts.map((p) => p.product_id)]}
              labelByValue={Object.fromEntries([
                ['', '— nenhum —'],
                ...linkedProducts.map((p) => [p.product_id, p.name] as const),
              ])}
            />
          )}
        </div>
      </div>

      <div />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover ingrediente"
        className="self-start rounded-md p-1.5 text-[rgb(var(--text-muted))]/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[9px] uppercase tracking-widest text-[rgb(var(--text-muted))]/70 mb-0.5">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-1 text-xs text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:border-gold/60"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  labelByValue,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  labelByValue?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="block text-[9px] uppercase tracking-widest text-[rgb(var(--text-muted))]/70 mb-0.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-1 text-xs text-[rgb(var(--text))] focus:outline-none focus:border-gold/60"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labelByValue?.[opt] ?? opt}
          </option>
        ))}
      </select>
    </label>
  );
}
