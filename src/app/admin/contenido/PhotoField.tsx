'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Button, Spinner } from '@/components/ui';
import { uploadFile } from '@/lib/api';

const SIZE = 512;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/** Recorta al centro en cuadrado, reduce a 512 px y re-codifica como JPEG: pesa poco y no conserva datos EXIF (ubicación, cámara). */
async function prepare(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.min(SIZE, side);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no pudo procesar la imagen');
  ctx.fillStyle = '#fff'; // los PNG con transparencia quedan sobre blanco
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo preparar la imagen'))), 'image/jpeg', 0.88));
}

/**
 * Foto del perfil: elige un archivo, se recorta y se sube al momento. `value` es el id guardado (o null) y `previewUrl`
 * la imagen a mostrar; el padre decide cuándo se persiste (al guardar el formulario).
 */
export function PhotoField({ name, previewUrl, hasPhoto, onChange }: { name: string; previewUrl: string | null; hasPhoto: boolean; onChange: (photo: { id: string; url: string } | null) => void }) {
  const inputId = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Usa una imagen JPG, PNG o WebP.');
    if (file.size > MAX_INPUT_BYTES) return setError('La imagen es demasiado grande (máx. 25 MB).');
    setBusy(true);
    try {
      const blob = await prepare(file);
      const form = new FormData();
      form.append('file', blob, 'foto.jpg');
      onChange(await uploadFile<{ id: string; url: string }>('/admin/content/images', form));
    } catch (e) {
      setError((e as Error).message || 'No se pudo subir la imagen.');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">Foto <span className="font-normal text-slate-500">(opcional)</span></span>
      <div className="flex items-center gap-4">
        <Avatar name={name || '?'} src={hasPhoto && previewUrl ? previewUrl : undefined} className="h-20 w-20 text-xl" />
        <div className="flex flex-wrap gap-2">
          <input ref={ref} id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
          <Button type="button" variant="outline" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <Spinner /> : <ImagePlus className="h-4 w-4" aria-hidden />} {hasPhoto ? 'Cambiar foto' : 'Subir foto'}
          </Button>
          {hasPhoto && <Button type="button" variant="ghost" onClick={() => onChange(null)} disabled={busy}><Trash2 className="h-4 w-4" aria-hidden /> Quitar</Button>}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">Se recorta en cuadrado y se reduce automáticamente; se eliminan los datos ocultos de la foto (ubicación, cámara).</p>
      {error && <p role="alert" className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}
