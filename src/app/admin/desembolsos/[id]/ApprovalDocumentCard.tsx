'use client';

import { FileDown, Send, Undo2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, Field, PageLoader } from '@/components/ui';
import { api, downloadFile } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dateTime } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { ApprovalDocFields, ApprovalDocView } from '@/lib/types';

type Form = { issuerName: string; signerName: string; signerTitle: string; financialEntity: string; accountLast4: string; requestDate: string; issuePlace: string; notes: string };
const toForm = (f: ApprovalDocFields): Form => ({ issuerName: f.issuerName, signerName: f.signerName ?? '', signerTitle: f.signerTitle ?? '', financialEntity: f.financialEntity, accountLast4: f.accountLast4 ?? '', requestDate: f.requestDate, issuePlace: f.issuePlace, notes: f.notes ?? '' });

/** Datos que figuran en el PDF de aprobación. Los define el superadmin; el cliente solo puede descargarlo cuando lo habilita. */
export function ApprovalDocumentCard({ id, code }: { id: string; code: string }) {
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'SUPERADMIN';
  const { data, error, loading, setData } = useFetch<ApprovalDocView>(`/admin/disbursements/${id}/approval-document`);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState<'save' | 'release' | 'withdraw' | 'pdf' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(toForm(data.fields));
  }, [data]);

  if (loading && !data) return <Card className="p-5"><PageLoader /></Card>;
  if (error || !data || !form) return <Card className="p-5"><p className="text-sm text-red-700" role="alert">{error ?? 'No se pudo cargar el documento'}</p></Card>;
  if (!data.eligible) return null;

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(data.fields));
  const status = data.released ? <Badge tone="green">Habilitado para el cliente</Badge> : data.configured ? <Badge tone="amber">Preparado · sin habilitar</Badge> : <Badge tone="slate">Sin preparar</Badge>;

  async function run<T>(kind: NonNullable<typeof busy>, fn: () => Promise<T>, message?: string) {
    setBusy(kind);
    setFormError(null);
    try {
      const result = await fn();
      if (message) toast.success(message);
      return result;
    } catch (e) {
      setFormError((e as Error).message);
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const view = await run('save', () => api.put<ApprovalDocView>(`/admin/disbursements/${id}/approval-document`, { ...form }), 'Datos del documento guardados');
    if (view) setData(view);
  }
  const release = async (publish: boolean) => {
    const view = await run(publish ? 'release' : 'withdraw', () => api.post<ApprovalDocView>(`/admin/disbursements/${id}/approval-document/${publish ? 'release' : 'withdraw'}`), publish ? 'Documento habilitado. El cliente recibió una alerta.' : 'Documento retirado: el cliente ya no puede descargarlo.');
    if (view) setData(view);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Documento de aprobación</h2>
        {status}
      </div>
      <p className="mt-1 text-sm text-slate-600">Define los datos que figurarán en el PDF. El cliente solo podrá descargarlo cuando lo habilites; mientras tanto el personal ve un borrador sellado.</p>

      <form onSubmit={save} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emisor">{(fid) => <input id={fid} className="input" value={form.issuerName} onChange={set('issuerName')} maxLength={160} disabled={!canEdit} />}</Field>
          <Field label="Entidad financiera">{(fid) => <input id={fid} className="input" value={form.financialEntity} onChange={set('financialEntity')} maxLength={120} disabled={!canEdit} placeholder="Banco de destino" />}</Field>
          <Field label="Últimos 4 dígitos de la cuenta">{(fid) => <input id={fid} className="input" value={form.accountLast4} onChange={set('accountLast4')} inputMode="numeric" pattern="\d{4}" maxLength={4} disabled={!canEdit} placeholder="1234" />}</Field>
          <Field label="Fecha de solicitud" hint={data.approvedOn ? `No puede ser posterior a la aprobación (${data.approvedOn})` : undefined}>{(fid) => <input id={fid} type="date" className="input" value={form.requestDate} onChange={set('requestDate')} max={data.approvedOn ?? undefined} disabled={!canEdit} required />}</Field>
          <Field label="Lugar de emisión">{(fid) => <input id={fid} className="input" value={form.issuePlace} onChange={set('issuePlace')} maxLength={120} disabled={!canEdit} />}</Field>
          <Field label="Firmante (opcional)">{(fid) => <input id={fid} className="input" value={form.signerName} onChange={set('signerName')} maxLength={120} disabled={!canEdit} placeholder="Dra. Nombre Apellido" />}</Field>
          <Field label="Cargo del firmante (opcional)" className="sm:col-span-2">{(fid) => <input id={fid} className="input" value={form.signerTitle} onChange={set('signerTitle')} maxLength={120} disabled={!canEdit} placeholder="Socia directora" />}</Field>
        </div>
        <Field label="Observaciones (opcional)" hint={`${form.notes.length}/600 · Aparecen en el documento`}>{(fid) => <textarea id={fid} className="input min-h-20" value={form.notes} onChange={set('notes')} maxLength={600} disabled={!canEdit} />}</Field>

        {data.released && dirty && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Al guardar, los PDF que el cliente ya descargó dejarán de verificarse: el código de verificación cubre estos datos.</p>}
        {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && <Button type="submit" loading={busy === 'save'} disabled={!dirty || busy !== null}>Guardar datos</Button>}
          {canEdit && !data.released && <Button type="button" variant="gold" loading={busy === 'release'} disabled={!data.configured || dirty || busy !== null} onClick={() => void release(true)}><Send className="h-4 w-4" aria-hidden /> Habilitar descarga al cliente</Button>}
          {canEdit && data.released && <Button type="button" variant="outline" loading={busy === 'withdraw'} disabled={busy !== null} onClick={() => void release(false)}><Undo2 className="h-4 w-4" aria-hidden /> Retirar del cliente</Button>}
          <Button type="button" variant="outline" loading={busy === 'pdf'} disabled={busy !== null} onClick={() => void run('pdf', () => downloadFile(`/admin/disbursements/${id}/approval-pdf`, `${data.released ? 'Aprobacion' : 'Borrador-Aprobacion'}-${code}.pdf`))}>
            <FileDown className="h-4 w-4" aria-hidden /> {data.released ? 'Descargar PDF' : 'Descargar borrador'}
          </Button>
        </div>
        {canEdit && !data.configured && <p className="text-xs text-slate-500">Revisa los datos (se propusieron a partir de la solicitud) y pulsa «Guardar datos» para poder habilitarlo.</p>}
        {data.updatedBy && <p className="text-xs text-slate-500">Última edición: {data.updatedBy} · {dateTime(data.updatedAt)}{data.released ? ` · Habilitado por ${data.releasedBy} el ${dateTime(data.releasedAt)}` : ''}</p>}
      </form>
    </Card>
  );
}
