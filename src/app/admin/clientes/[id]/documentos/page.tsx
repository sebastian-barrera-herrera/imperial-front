'use client';

import { ArrowLeft, Download, FileText, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { SuperOnly } from '@/components/SuperOnly';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, ConfirmModal, EmptyState, ErrorBox, Field, PageHeader, PageLoader } from '@/components/ui';
import { api, downloadFile, uploadFile } from '@/lib/api';
import { dateTime, fileSize } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { ISSUED_CATEGORY_LABELS, type IssuedCategory, type IssuedDocument } from '@/lib/types';

type View = { client: { id: string; fullName: string; email: string }; cases: { id: string; number: string; title: string }[]; items: IssuedDocument[] };
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ['application/pdf', 'image/jpeg', 'image/png'];

function ClientDocuments() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch<View>(`/admin/clients/${id}/issued-documents`);
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IssuedCategory>('CONTRACT');
  const [caseId, setCaseId] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<IssuedDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  function pick(f: File | undefined) {
    setFormError(null);
    if (!f) return setFile(null);
    if (!ACCEPT.includes(f.type)) { setFile(null); return setFormError('Formato no permitido (usa PDF, JPG o PNG).'); }
    if (f.size > MAX_BYTES) { setFile(null); return setFormError('El archivo supera el máximo de 10 MB.'); }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setFormError(null);
    setPercent(0);
    const form = new FormData();
    form.append('title', title.trim());
    form.append('category', category);
    if (description.trim()) form.append('description', description.trim());
    if (caseId) form.append('caseId', caseId);
    form.append('file', file);
    try {
      await uploadFile(`/admin/clients/${id}/issued-documents`, form, setPercent);
      toast.success('Documento enviado. El cliente recibió una alerta.');
      setTitle(''); setDescription(''); setCaseId(''); setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      await reload();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setPercent(null);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/issued-documents/${toDelete.id}`);
      toast.success('Documento retirado');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'Cliente no encontrado'} onRetry={reload} />;

  const uploading = percent !== null;
  const valid = !!file && title.trim().length >= 3;

  return (
    <>
      <Link href="/admin/clientes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-800"><ArrowLeft className="h-4 w-4" aria-hidden /> Volver a clientes</Link>
      <PageHeader title="Documentos del despacho" description={`Documentos que entregas a ${data.client.fullName} (${data.client.email}). El cliente los verá en su cuenta, en «Mis documentos → Recibidos del despacho», y recibirá una alerta.`} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="h-fit p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Entregar un documento</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Título" hint="Cómo lo verá el cliente">{(fid) => <input id={fid} className="input" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder="Contrato de servicios" />}</Field>
            <Field label="Tipo">{(fid) => <select id={fid} className="input" value={category} onChange={(e) => setCategory(e.target.value as IssuedCategory)}>{Object.entries(ISSUED_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
            {data.cases.length > 0 && (
              <Field label="Caso (opcional)">{(fid) => <select id={fid} className="input" value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">Sin caso asociado</option>{data.cases.map((c) => <option key={c.id} value={c.id}>{c.number} · {c.title}</option>)}</select>}</Field>
            )}
            <Field label="Mensaje o descripción (opcional)" hint={`${description.length}/500`}>{(fid) => <textarea id={fid} className="input min-h-20" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />}</Field>
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Archivo</span>
              <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" className="input file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700" aria-label="Archivo a entregar" onChange={(e) => pick(e.target.files?.[0])} />
              <p className="mt-1 text-xs text-slate-500">PDF, JPG o PNG · máx. 10 MB</p>
            </div>
            {uploading && <div className="h-1.5 rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-navy-600 transition-all" style={{ width: `${percent}%` }} /></div>}
            {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>}
            <Button type="submit" loading={uploading} disabled={!valid}><Send className="h-4 w-4" aria-hidden /> Enviar al cliente</Button>
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <h2 className="border-b border-slate-200 px-5 py-4 text-lg font-semibold">Entregados ({data.items.length})</h2>
          {data.items.length === 0 ? (
            <EmptyState icon={<FileText className="h-10 w-10" />} title="Aún no has entregado documentos a este cliente">Usa el formulario para enviar el primero.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.items.map((d) => (
                <li key={d.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">{d.title}<Badge tone="slate">{ISSUED_CATEGORY_LABELS[d.category]}</Badge></p>
                    <p className="text-xs text-slate-500">{d.originalName} · {fileSize(d.size)} · enviado {dateTime(d.createdAt)}{d.case ? ` · Caso ${d.case.number}` : ''}</p>
                    <p className="mt-0.5 text-xs">{d.viewedAt ? <span className="text-green-700">Abierto por el cliente el {dateTime(d.viewedAt)}</span> : <span className="text-slate-500">Aún no lo ha abierto</span>}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" className="px-2" aria-label={`Descargar ${d.title}`} onClick={() => void downloadFile(`/admin/issued-documents/${d.id}/download`, d.originalName).catch((e) => toast.error((e as Error).message))}><Download className="h-4 w-4" aria-hidden /></Button>
                    <Button variant="ghost" className="px-2 text-red-700" aria-label={`Retirar ${d.title}`} onClick={() => setToDelete(d)}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmModal open={!!toDelete} danger title="Retirar documento" confirmLabel="Retirar" loading={deleting} onClose={() => setToDelete(null)} onConfirm={remove}
        message={<>El cliente dejará de ver <strong>{toDelete?.title}</strong> y el archivo se borrará. Esta acción no se puede deshacer.</>} />
    </>
  );
}

export default function ClientDocumentsPage() {
  return <SuperOnly><ClientDocuments /></SuperOnly>;
}
