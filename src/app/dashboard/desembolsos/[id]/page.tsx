'use client';

import { ArrowLeft, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Button, Card, ConfirmModal, DisbursementBadge, DocStatusBadge, ErrorBox, PageLoader, Timeline } from '@/components/ui';
import { api } from '@/lib/api';
import { dateTime, fileSize, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { DISBURSEMENT_STATUS_LABELS, DOC_CATEGORY_LABELS, type Disbursement } from '@/lib/types';

export default function DisbursementDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useFetch<Disbursement>(`/disbursements/${id}`);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useOnLive(() => void reload());

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'Solicitud no encontrada'} />;

  async function cancel() {
    setBusy(true);
    try {
      setData(await api.post<Disbursement>(`/disbursements/${id}/cancel`));
      toast.success('Solicitud cancelada');
      setConfirm(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/dashboard/desembolsos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-800"><ArrowLeft className="h-4 w-4" /> Volver a solicitudes</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{data.code}</h1>
          <p className="mt-1 text-slate-600">{data.concept}</p>
        </div>
        <div className="flex items-center gap-3"><DisbursementBadge status={data.status} />{data.status === 'PENDING' && <Button variant="outline" onClick={() => setConfirm(true)}>Cancelar solicitud</Button>}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Detalle</h2>
            <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Monto solicitado</dt><dd className="font-serif text-xl font-semibold text-navy-900">{money(data.amount, data.currency)}</dd></div>
              <div><dt className="text-slate-500">Estado actual</dt><dd className="font-medium">{DISBURSEMENT_STATUS_LABELS[data.status]}</dd></div>
              <div><dt className="text-slate-500">Fecha de creación</dt><dd>{dateTime(data.createdAt)}</dd></div>
              <div><dt className="text-slate-500">Desembolsada el</dt><dd>{dateTime(data.disbursedAt)}</dd></div>
              <div><dt className="text-slate-500">Cuenta destino</dt><dd>{data.bankName ?? '—'} · ••••{data.accountLast4 ?? '----'}</dd></div>
              <div><dt className="text-slate-500">Caso asociado</dt><dd>{data.case ? <Link className="text-navy-700 underline" href={`/dashboard/casos/${data.case.id}`}>{data.case.number}</Link> : '—'}</dd></div>
            </dl>
            {data.adminNote && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><strong>Nota del equipo:</strong> {data.adminNote}</p>}
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold">Documentos asociados</h2>
            {(data.documents ?? []).length === 0 ? <p className="mt-2 text-sm text-slate-500">No adjuntaste documentos a esta solicitud.</p> : (
              <ul className="mt-3 divide-y divide-slate-100">
                {data.documents!.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-2.5">
                    <FileText className="h-5 w-5 text-navy-300" aria-hidden />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{d.originalName}</p><p className="text-xs text-slate-500">{DOC_CATEGORY_LABELS[d.category]} · {fileSize(d.size)}</p></div>
                    <DocStatusBadge status={d.status} />
                    <a href={`/api/documents/${d.id}/download`} className="btn-ghost px-2" aria-label={`Descargar ${d.originalName}`}><Download className="h-4 w-4" /></a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold">Historial de cambios</h2>
          <Timeline items={(data.events ?? []).map((e) => ({ id: e.id, title: DISBURSEMENT_STATUS_LABELS[e.toStatus], description: e.note, meta: e.actorName ?? undefined, at: dateTime(e.createdAt) }))} />
        </Card>
      </div>

      <ConfirmModal open={confirm} title="Cancelar solicitud" danger confirmLabel="Sí, cancelar" loading={busy} onConfirm={cancel} onClose={() => setConfirm(false)}
        message="Solo puedes cancelar solicitudes pendientes. Esta acción no se puede deshacer." />
    </>
  );
}
