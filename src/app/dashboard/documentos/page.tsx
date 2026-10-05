'use client';

import { Download, FileText, Inbox, Trash2, UploadCloud } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState, type DragEvent } from 'react';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, ConfirmModal, DocStatusBadge, EmptyState, ErrorBox, PageHeader, PageLoader, Tabs, cn } from '@/components/ui';
import { api, downloadFile, uploadFile } from '@/lib/api';
import { dateTime, fileSize } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { DOC_CATEGORY_LABELS, ISSUED_CATEGORY_LABELS, type DocumentCategory, type DocumentItem, type DocumentSummary, type IssuedDocument } from '@/lib/types';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ['application/pdf', 'image/jpeg', 'image/png'];
const HINTS: Record<DocumentCategory, string> = {
  IDENTITY: 'Cédula por ambas caras o pasaporte.',
  BANKING: 'Certificación bancaria o extracto reciente.',
  LEGAL: 'Contratos, poderes, sentencias u otros soportes legales.',
  RECEIPT: 'Comprobantes de pago o consignaciones.',
};

type Upload = { name: string; percent: number; error?: string };

function MyFiles() {
  const toast = useToast();
  const [category, setCategory] = useState<DocumentCategory>('IDENTITY');
  const { data, error, loading, reload } = useFetch<{ items: DocumentItem[]; summary: DocumentSummary[] }>('/documents');
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // La validación del equipo llega en vivo: se recarga la lista al recibir una alerta de documentos.
  useOnLive((e) => (e.type === 'refresh' || e.data.type === 'DOCUMENT') && void reload());

  async function handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const fail = (msg: string) => setUploads((u) => [...u, { name: file.name, percent: 0, error: msg }]);
      if (!ACCEPT.includes(file.type)) { fail('Formato no permitido (usa PDF, JPG o PNG)'); continue; }
      if (file.size > MAX_BYTES) { fail('Supera el máximo de 10 MB'); continue; }
      setUploads((u) => [...u, { name: file.name, percent: 0 }]);
      const form = new FormData();
      form.append('category', category);
      form.append('file', file);
      try {
        await uploadFile('/documents', form, (percent) => setUploads((u) => u.map((x) => (x.name === file.name && !x.error ? { ...x, percent } : x))));
        setUploads((u) => u.filter((x) => x.name !== file.name));
        toast.success(`"${file.name}" cargado. Quedó pendiente de validación.`);
      } catch (err) {
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, error: (err as Error).message } : x)));
      }
    }
    await reload();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${toDelete.id}`);
      toast.success('Documento eliminado');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;

  const items = (data?.items ?? []).filter((d) => d.category === category);
  const tabs = (data?.summary ?? []).map((s) => ({ id: s.category, label: s.label, count: s.total }));

  return (
    <>
      <Tabs tabs={tabs} value={category} onChange={setCategory} />

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-base font-semibold">{DOC_CATEGORY_LABELS[category]}</h2>
            <p className="mt-0.5 text-sm text-slate-600">{HINTS[category]}</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
              onClick={() => input.current?.click()} role="button" tabIndex={0} aria-label={`Subir archivos a ${DOC_CATEGORY_LABELS[category]}`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
              className={cn('mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition', dragging ? 'border-gold-500 bg-gold-50' : 'border-slate-300 hover:border-navy-400 hover:bg-slate-50')}>
              <UploadCloud className="h-8 w-8 text-navy-400" aria-hidden />
              <p className="mt-2 text-sm font-medium text-slate-700">Arrastra archivos o haz clic para elegir</p>
              <p className="text-xs text-slate-500">PDF, JPG o PNG · máx. 10 MB</p>
              <input ref={input} type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ''; }} />
            </div>
            {uploads.length > 0 && (
              <ul className="mt-4 space-y-2">
                {uploads.map((u, i) => (
                  <li key={`${u.name}-${i}`} className="rounded-lg border border-slate-200 p-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2"><span className="truncate">{u.name}</span>
                      {u.error ? <button className="text-xs underline" onClick={() => setUploads((x) => x.filter((_, j) => j !== i))}>Quitar</button> : <span className="text-xs text-slate-500">{u.percent}%</span>}</div>
                    {u.error ? <p className="mt-1 text-xs text-red-600" role="alert">{u.error}</p> : <div className="mt-1.5 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-navy-600 transition-all" style={{ width: `${u.percent}%` }} /></div>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            {items.length === 0 ? (
              <EmptyState icon={<FileText className="h-10 w-10" />} title="Todavía no has subido documentos en esta categoría">Usa el cuadro de carga para añadir el primero.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((d) => (
                  <li key={d.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                    <FileText className="hidden h-8 w-8 shrink-0 text-navy-300 sm:block" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{d.originalName}</p>
                      <p className="text-xs text-slate-500">{fileSize(d.size)} · subido {dateTime(d.createdAt)}</p>
                      {d.status === 'REJECTED' && d.rejectionReason && <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-800"><strong>Motivo del rechazo:</strong> {d.rejectionReason}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <DocStatusBadge status={d.status} />
                      <a href={`/api/documents/${d.id}/download`} className="btn-ghost px-2" aria-label={`Descargar ${d.originalName}`}><Download className="h-4 w-4" /></a>
                      <button className="btn-ghost px-2 text-red-600 disabled:text-slate-300" disabled={d.status === 'VALIDATED'} title={d.status === 'VALIDATED' ? 'Un documento validado no puede eliminarse' : undefined} aria-label={`Eliminar ${d.originalName}`} onClick={() => setToDelete(d)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal open={!!toDelete} title="Eliminar documento" danger confirmLabel="Eliminar" loading={deleting} onConfirm={confirmDelete} onClose={() => setToDelete(null)}
        message={<>¿Seguro que quieres eliminar <strong>{toDelete?.originalName}</strong>? Esta acción no se puede deshacer.</>} />
    </>
  );
}

/** Documentos que el despacho le entregó al cliente (contratos, constancias, resoluciones…). */
function ReceivedFiles({ items, reload }: { items: IssuedDocument[]; reload: () => Promise<void> }) {
  const toast = useToast();
  async function download(d: IssuedDocument) {
    try {
      await downloadFile(`/issued-documents/${d.id}/download`, d.originalName);
      await reload(); // la primera descarga lo marca como visto
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <Card>
      {items.length === 0 ? (
        <EmptyState icon={<Inbox className="h-10 w-10" />} title="Aún no has recibido documentos del despacho">Cuando nuestro equipo te entregue un contrato, una constancia u otro documento, aparecerá aquí y recibirás una alerta.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
              <FileText className="hidden h-8 w-8 shrink-0 text-navy-300 sm:block" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">{d.title}{!d.viewedAt && <Badge tone="blue">Nuevo</Badge>}</p>
                <p className="text-xs text-slate-500">{ISSUED_CATEGORY_LABELS[d.category]} · {fileSize(d.size)} · recibido {dateTime(d.createdAt)}{d.case ? ` · Caso ${d.case.number}` : ''}</p>
                {d.description && <p className="mt-1 text-sm text-slate-600">{d.description}</p>}
              </div>
              <Button variant="outline" onClick={() => void download(d)} aria-label={`Descargar ${d.title}`}><Download className="h-4 w-4" aria-hidden /> Descargar</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DocumentsPage() {
  const params = useSearchParams();
  const [view, setView] = useState<'mine' | 'received'>(params.get('tab') === 'recibidos' ? 'received' : 'mine');
  const received = useFetch<IssuedDocument[]>('/issued-documents');
  useOnLive((e) => (e.type === 'refresh' || e.data.type === 'DOCUMENT') && void received.reload());
  const unread = (received.data ?? []).filter((d) => !d.viewedAt).length;
  return (
    <>
      <PageHeader title="Mis documentos" description="Sube tus archivos para su validación y consulta los documentos que el despacho te entrega." />
      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-surface p-1" role="tablist" aria-label="Tipo de documentos">
        {([['mine', 'Mis archivos'], ['received', 'Recibidos del despacho']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium transition', view === id ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100')}>
            {label}{id === 'received' && unread > 0 && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-night-900">{unread}</span>}
          </button>
        ))}
      </div>
      {view === 'mine' ? <MyFiles /> : received.loading && !received.data ? <PageLoader /> : received.error ? <ErrorBox message={received.error} onRetry={received.reload} /> : <ReceivedFiles items={received.data ?? []} reload={received.reload} />}
    </>
  );
}

export default function DocumentsRoute() {
  return <Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense>;
}
