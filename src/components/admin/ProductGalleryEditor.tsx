'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, Upload, Trash2, GripVertical } from 'lucide-react';
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProductImage } from '@/types/database';

type GalleryImage = Pick<ProductImage, 'id' | 'image_url' | 'alt_text' | 'display_order' | 'active'>;

type Props = {
  productId: string;
};

export function ProductGalleryEditor({ productId }: Props) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialFetchRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    fetch(`/api/admin/produtos/${productId}/imagens`)
      .then((res) => res.json())
      .then((data: { ok: boolean; items?: GalleryImage[]; message?: string }) => {
        if (data.ok && data.items) setImages(data.items);
        else if (data.message) setError(data.message);
      })
      .catch(() => setError('Falha ao carregar galeria.'))
      .finally(() => setLoading(false));
  }, [productId]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: GalleryImage[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`/api/admin/produtos/${productId}/imagens`, { method: 'POST', body: fd });
        const data = (await res.json()) as { ok: boolean; item?: GalleryImage; message?: string };
        if (!data.ok || !data.item) {
          setError(data.message ?? 'Falha no upload.');
          break;
        }
        uploaded.push(data.item);
      }
      if (uploaded.length > 0) setImages((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function onRemove(imageId: string) {
    if (!confirm('Remover esta imagem da galeria?')) return;
    const res = await fetch(`/api/admin/produtos/${productId}/imagens?image_id=${imageId}`, { method: 'DELETE' });
    const data = (await res.json()) as { ok: boolean; message?: string };
    if (data.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      setError(data.message ?? 'Falha ao remover.');
    }
  }

  async function onAltChange(imageId: string, altText: string) {
    setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, alt_text: altText } : img)));
    // Debounce/save: persiste imediatamente; a UX simples é a melhor aqui
    await fetch(`/api/admin/produtos/${productId}/imagens`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_id: imageId, alt_text: altText }),
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(images, oldIndex, newIndex);
    setImages(reordered);
    await fetch(`/api/admin/produtos/${productId}/imagens`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map((img) => img.id) }),
    });
  }

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text))]">Galeria de imagens</h3>
          <p className="text-[11px] text-[rgb(var(--text-muted))]">
            Imagens adicionais do produto. Arraste pra reordenar. A imagem principal continua sendo &quot;URL da imagem principal&quot; acima.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="admin-btn-primary inline-flex items-center gap-1.5"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Upload className="h-3.5 w-3.5" strokeWidth={2} />}
          {uploading ? 'Enviando…' : 'Adicionar imagens'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[rgb(var(--text-muted))]">Carregando galeria…</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-muted))]/70 text-center py-6">
          Nenhuma imagem na galeria. Clique em &quot;Adicionar imagens&quot; pra começar.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img) => (
                <SortableImage
                  key={img.id}
                  image={img}
                  onRemove={() => onRemove(img.id)}
                  onAltChange={(alt) => onAltChange(img.id, alt)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableImage({
  image,
  onRemove,
  onAltChange,
}: {
  image: GalleryImage;
  onRemove: () => void;
  onAltChange: (alt: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] overflow-hidden"
    >
      <div className="relative aspect-square bg-[rgb(var(--surface-elevated))]">
        <Image
          src={image.image_url}
          alt={image.alt_text ?? ''}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arraste para reordenar"
          className="absolute top-2 left-2 rounded-md bg-black/60 backdrop-blur-sm p-1.5 text-white/80 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover imagem"
          className="absolute top-2 right-2 rounded-md bg-red-900/70 backdrop-blur-sm p-1.5 text-red-200 hover:text-white hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
      <input
        type="text"
        placeholder="Alt text (acessibilidade)"
        defaultValue={image.alt_text ?? ''}
        onBlur={(e) => onAltChange(e.target.value)}
        className="w-full px-2.5 py-1.5 text-xs bg-transparent border-t border-[rgb(var(--border))] text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:bg-[rgb(var(--surface))]"
      />
    </div>
  );
}
