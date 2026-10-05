'use client';

import { ImagePlus, Pencil, ShieldAlert, Trash2, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { SuperOnly } from '@/components/SuperOnly';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, ConfirmModal, EmptyState, ErrorBox, PageHeader, PageLoader } from '@/components/ui';
import { api, uploadFile } from '@/lib/api';
import { date, fileSize } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { StudioImage } from '@/lib/types';

const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

function Studio() {
  const router = useRouter();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch<StudioImage[]>('/admin/studio/images');
  const input = useRef<HTMLInputElement>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<StudioImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (!ACCEPT.includes(file.type)) return setUploadError('Formato no admitido. Usa una imagen JPG, PNG o WebP.');
    if (file.size > MAX_BYTES) return setUploadError('La imagen supera el máximo de 15 MB.');
    setPercent(0);
    const form = new FormData();
    form.append('file', file);
    try {
      const created = await uploadFile<StudioImage>('/admin/studio/images', form, setPercent);
      toast.success('Imagen subida. Se conserva el original intacto.');
      router.push(`/admin/imagenes/${created.id}`);
    } catch (e) {
      setUploadError((e as Error).message);
      setPercent(null);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/studio/images/${toDelete.id}`);
      toast.success('Imagen eliminada con todas sus versiones');
      setToDelete(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader title="Editor de imágenes" description="Sube una imagen y cambia los textos que contiene conservando el resto tal cual. Después puedes descargarla. El original nunca se modifica." />

      <Card className="mb-5 flex gap-3 border-gold-300 bg-gold-50 p-4 text-sm text-slate-800">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold-800" aria-hidden />
        <p><strong>Úsalo solo con piezas gráficas propias del despacho</strong> (flyers, publicaciones, tarjetas…). No lo uses para modificar documentos, comprobantes ni identificaciones de otras personas. Se conserva siempre el original y cada versión y descarga queda registrada con quién, cuándo y la huella del archivo.</p>
      </Card>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files[0]); }}
        onClick={() => percent === null && input.current?.click()} role="button" tabIndex={0} aria-label="Subir una imagen para editar"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && percent === null && input.current?.click()}
        className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${dragging ? 'border-gold-500 bg-gold-50' : 'border-slate-300 hover:border-navy-400 hover:bg-slate-50'}`}>
        <UploadCloud className="h-8 w-8 text-navy-400" aria-hidden />
        <p className="mt-2 text-sm font-medium text-slate-700">Arrastra una imagen o haz clic para elegirla</p>
        <p className="text-xs text-slate-500">JPG, PNG o WebP · máx. 15 MB</p>
        <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
        {percent !== null && <div className="mt-4 h-1.5 w-56 rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-navy-600 transition-all" style={{ width: `${percent}%` }} /></div>}
      </div>
      {uploadError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{uploadError}</p>}

      <h2 className="mb-3 mt-8 text-lg font-semibold">Mis imágenes</h2>
      {loading && !data ? <PageLoader /> : error || !data ? <ErrorBox message={error ?? 'No se pudieron cargar las imágenes'} onRetry={reload} /> : data.length === 0 ? (
        <Card><EmptyState icon={<ImagePlus className="h-10 w-10" />} title="Aún no has subido imágenes">Sube la primera para empezar a editarla.</EmptyState></Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((img) => (
            <li key={img.id} className="card flex flex-col overflow-hidden">
              <Link href={`/admin/imagenes/${img.id}`} className="block bg-slate-100" aria-label={`Editar ${img.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/admin/studio/images/${img.id}/original`} alt={`Original de ${img.title}`} loading="lazy" className="h-44 w-full object-contain" />
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="truncate font-sans text-base font-semibold text-slate-900" title={img.title}>{img.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{img.originalName} · {fileSize(img.size)} · {date(img.createdAt)}</p>
                <div className="mt-2"><Badge tone={img.versionCount ? 'green' : 'slate'}>{img.versionCount === 0 ? 'Sin ediciones' : img.versionCount === 1 ? '1 versión' : `${img.versionCount} versiones`}</Badge></div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/admin/imagenes/${img.id}`} className="btn-primary flex-1"><Pencil className="h-4 w-4" aria-hidden /> Editar</Link>
                  <Button variant="outline" className="px-3 text-red-700" aria-label={`Eliminar ${img.title}`} onClick={() => setToDelete(img)}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal open={!!toDelete} danger title="Eliminar imagen" confirmLabel="Eliminar" loading={deleting} onClose={() => setToDelete(null)} onConfirm={remove}
        message={<>Se eliminará <strong>{toDelete?.title}</strong> con su original y todas sus versiones. Esta acción no se puede deshacer.</>} />
    </>
  );
}

export default function StudioPage() {
  return <SuperOnly><Studio /></SuperOnly>;
}
