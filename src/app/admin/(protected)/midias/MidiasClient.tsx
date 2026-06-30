'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Copy, Trash2, Loader2, Image as ImageIcon, FileText } from 'lucide-react';
import type { MediaAsset } from '@/types/database';

type Props = { assets: Pick<MediaAsset, 'id' | 'file_name' | 'mime_type' | 'public_url' | 'alt_text' | 'size_bytes' | 'created_at' | 'bucket'>[] };

export function MidiasClient({ assets }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // Vídeos para o hero devem ter ≤8MB (adendo v1.1)
    const isVideo = file.type.startsWith('video/');
    const VIDEO_LIMIT = 8 * 1024 * 1024;
    if (isVideo && file.size > VIDEO_LIMIT) {
      setError(`Vídeos para o hero devem ter no máximo 8 MB (arquivo enviado: ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setUploading(true);

    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/admin/midias/upload', { method: 'POST', body: fd });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) {
      router.refresh();
    } else {
      setError(data.message ?? 'Erro no upload.');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function onDelete(id: string) {
    await fetch(`/api/admin/midias?id=${id}`, { method: 'DELETE' });
    router.refresh();
  }

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-[rgb(var(--border))] rounded-xl p-8 text-center mb-8 hover:border-gold/30 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" className="hidden" accept="image/*,video/mp4,video/webm,application/pdf,.svg" onChange={onFileChange} />
        {uploading ? (
          <div className="flex items-center justify-center gap-3 text-[rgb(var(--text-muted))]">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
            <span className="text-sm">Enviando arquivo…</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[rgb(var(--text-muted))]/60 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-[rgb(var(--text-muted))]">Clique para selecionar um arquivo</p>
            <p className="text-[11px] text-[rgb(var(--text-muted))]/60 mt-1">Imagens, PDF, SVG — máx. 10 MB · Vídeos MP4/WebM — máx. 8 MB</p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {/* Grid */}
      {assets.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-muted))]/60 text-center py-8">Nenhum arquivo enviado.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {assets.map((asset) => {
            const isImage = asset.mime_type?.startsWith('image/') ?? false;
            return (
              <div key={asset.id} className="group relative rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 overflow-hidden">
                {/* Preview */}
                <div className="aspect-square bg-[rgb(var(--surface-elevated))] flex items-center justify-center overflow-hidden">
                  {isImage && asset.public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.public_url} alt={asset.alt_text ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="h-8 w-8 text-[rgb(var(--text-muted))]/40" strokeWidth={1} />
                  )}
                </div>
                {/* Info */}
                <div className="p-2">
                  <p className="text-[11px] text-[rgb(var(--text-muted))] truncate">{asset.file_name ?? 'arquivo'}</p>
                  <p className="text-[10px] text-[rgb(var(--text-muted))]/60">{formatBytes(asset.size_bytes)}</p>
                </div>
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-[rgb(var(--surface))]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {asset.public_url && (
                    <button
                      onClick={() => copyUrl(asset.public_url!)}
                      className="rounded-lg bg-[rgb(var(--surface-elevated))] p-2 text-[rgb(var(--text))] hover:bg-gold/20 hover:text-gold transition-colors"
                      title="Copiar URL"
                    >
                      {copied === asset.public_url ? (
                        <span className="text-[10px] text-gold">Copiado!</span>
                      ) : (
                        <Copy className="h-4 w-4" strokeWidth={1.5} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(asset.id)}
                    className="rounded-lg bg-[rgb(var(--surface-elevated))] p-2 text-[rgb(var(--text))] hover:bg-red-900/40 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
