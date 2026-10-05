'use client';

import { ArrowLeft, Download, FileDown, FileText } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Button, Card, DisbursementBadge, DocStatusBadge, ErrorBox, Field, Modal, PageLoader, Timeline } from '@/components/ui';
import { api, downloadFile } from '@/lib/api';
import { dateTime, fileSize, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { DISBURSEMENT_STATUS_LABELS, DISBURSEMENT_TRANSITIONS, DOC_CATEGORY_LABELS, type Disbursement, type DisbursementStatus } from '@/lib/types';

export default function AdminDisbursementDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data, error, loading, setData } = useFetch<Disbursement>(`/admin/disbursements/${id}`);
  const [target, setTarget] = useState<DisbursementStatus | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'Solicitud no encontrada'} />;

  const next = DISBURSEMENT_TRANSITIONS[data.status];
  const needsNote = target === 'REJECTED';

  async function apply() {
    if (!target) return;
    setBusy(true);
    try {
      setData(await api.patch<Disbursement>(`/admin/disbursements/${id}/status`, { status: target, note: note.trim() || undefined }));
      toast.success(`Estado actualizado a "${DISBURSEMENT_STATUS_LABELS[target]}". El cliente fue notificado.`);
      setTarget(null);
      setNote('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function downloadApproval() {
    setPdfBusy(true);
    try {
      await downloadFile(`/admin/disbursements/${id}/approval-pdf`, `Aprobacion-${data?.code ?? 'desembolso'}.pdf`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <>
      <Link href="/admin/desembolsos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-800"><ArrowLeft className="h-4 w-4" /> Volver a desembolsos</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">{data.code}</h1><p className="mt-1 text-slate-600">{data.concept}</p></div>
        <div className="flex flex-wrap items-center gap-3"><DisbursementBadge status={data.status} />{['APPROVED', 'IN_PROCESS', 'DISBURSED'].includes(data.status) && <Button variant="outline" onClick={downloadApproval} loading={pdfBusy}><FileDown className="h-4 w-4" aria-hidden /> Documento de aprobación (PDF)</Button>}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Detalle</h2>
            <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Monto</dt><dd className="font-serif text-xl font-semibold text-navy-900">{money(data.amount, data.currency)}</dd></div>
              <div><dt className="text-slate-500">Cliente</dt><dd>{data.client?.fullName}<span className="block text-xs text-slate-500">{data.client?.email}</span></dd></div>
              <div><dt className="text-slate-500">Cuenta destino</dt><dd>{data.bankName ?? '—'} · ••••{data.accountLast4 ?? '----'}</dd></div>
              <div><dt className="text-slate-500">Caso asociado</dt><dd>{data.case ? <Link className="text-navy-700 underline" href={`/admin/casos/${data.case.id}`}>{data.case.number}</Link> : '—'}</dd></div>
              <div><dt className="text-slate-500">Creada</dt><dd>{dateTime(data.createdAt)}</dd></div>
              <div><dt className="text-slate-500">Desembolsada</dt><dd>{dateTime(data.disbursedAt)}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold">Documentos adjuntos</h2>
            {(data.documents ?? []).length === 0 ? <p className="mt-2 text-sm text-slate-500">El cliente no adjuntó documentos.</p> : (
              <ul className="mt-3 divide-y divide-slate-100">
                {data.documents!.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-2.5"><FileText className="h-5 w-5 text-navy-300" aria-hidden />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{d.originalName}</p><p className="text-xs text-slate-500">{DOC_CATEGORY_LABELS[d.category]} · {fileSize(d.size)}</p></div>
                    <DocStatusBadge status={d.status} /><a href={`/api/documents/${d.id}/download`} className="btn-ghost px-2" aria-label={`Descargar ${d.originalName}`}><Download className="h-4 w-4" /></a></li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Cambiar estado</h2>
            {next.length === 0 ? <p className="mt-2 text-sm text-slate-500">Esta solicitud está cerrada ({DISBURSEMENT_STATUS_LABELS[data.status].toLowerCase()}); no admite más cambios.</p> : (
              <div className="mt-3 flex flex-col gap-2">
                {next.map((s) => <Button key={s} variant={s === 'REJECTED' ? 'danger' : 'primary'} onClick={() => { setTarget(s); setNote(''); }}>Pasar a «{DISBURSEMENT_STATUS_LABELS[s]}»</Button>)}
              </div>
            )}
          </Card>
          <Card className="p-5"><h2 className="mb-4 text-lg font-semibold">Historial</h2>
            <Timeline items={(data.events ?? []).map((e) => ({ id: e.id, title: DISBURSEMENT_STATUS_LABELS[e.toStatus], description: e.note, meta: e.actorName ?? undefined, at: dateTime(e.createdAt) }))} /></Card>
        </div>
      </div>

      <Modal open={!!target} onClose={() => !busy && setTarget(null)} title={target ? `Pasar a «${DISBURSEMENT_STATUS_LABELS[target]}»` : ''} footer={<>
        <Button variant="outline" onClick={() => setTarget(null)} disabled={busy}>Cancelar</Button>
        <Button variant={needsNote ? 'danger' : 'primary'} loading={busy} disabled={needsNote && note.trim().length < 5} onClick={() => void apply()}>Confirmar y notificar</Button>
      </>}>
        <Field label={needsNote ? 'Motivo del rechazo (obligatorio)' : 'Nota para el cliente (opcional)'} hint="El cliente recibirá una alerta con este mensaje.">{(fid) => <textarea id={fid} rows={3} maxLength={500} className="input" value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      </Modal>
    </>
  );
}
