'use client';

import { Check, Download, FileCheck2, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useToast } from '@/components/toast';
import { Button, DocStatusBadge, EmptyState, ErrorBox, Field, Modal, PageHeader, PageLoader, Pagination, TableCard } from '@/components/ui';
import { api } from '@/lib/api';
import { dateTime, fileSize } from '@/lib/format';
import { qs, useDebounced, useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { DOC_CATEGORY_LABELS, DOC_STATUS_LABELS, type DocumentCategory, type DocumentItem, type DocumentStatus, type Paged } from '@/lib/types';

function DocumentsQueue() {
  const toast = useToast();
  const ownerId = useSearchParams().get('ownerId') ?? undefined;
  const [status, setStatus] = useState<DocumentStatus | ''>('PENDING');
  const [category, setCategory] = useState<DocumentCategory | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const { data, error, loading, reload } = useFetch<Paged<DocumentItem>>(`/admin/documents${qs({ status, category, search: debounced, ownerId, page, pageSize: 15 })}`);
  const [rejecting, setRejecting] = useState<DocumentItem | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useOnLive(() => void reload());

  async function review(doc: DocumentItem, action: 'validate' | 'reject') {
    setBusyId(doc.id);
    try {
      await api.post(`/admin/documents/${doc.id}/${action}`, action === 'reject' ? { reason: reason.trim() } : undefined);
      toast.success(action === 'validate' ? 'Documento validado y cliente notificado' : 'Documento rechazado y cliente notificado');
      setRejecting(null);
      setReason('');
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Validación de documentos" description="Revisa los documentos cargados por los clientes. Cada decisión notifica al cliente en tiempo real." />
      <div className="mb-3 flex flex-wrap gap-2">
        <select aria-label="Estado" className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value as DocumentStatus | ''); setPage(1); }}>
          <option value="">Todos los estados</option>{Object.entries(DOC_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Categoría" className="input w-auto" value={category} onChange={(e) => { setCategory(e.target.value as DocumentCategory | ''); setPage(1); }}>
          <option value="">Todas las categorías</option>{Object.entries(DOC_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input className="input max-w-xs" placeholder="Buscar archivo o cliente…" aria-label="Buscar" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        {ownerId && <span className="self-center text-sm text-slate-500">Filtrado por un cliente.</span>}
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <PageLoader /> : (
        <TableCard>
          {data?.items.length === 0 ? <EmptyState icon={<FileCheck2 className="h-10 w-10" />} title={status === 'PENDING' ? '¡Todo al día! No hay documentos pendientes' : 'No hay documentos con estos filtros'} /> : (
            <table className="rtable w-full">
              <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Cliente</th><th className="th">Documento</th><th className="th">Categoría</th><th className="th">Subido</th><th className="th">Estado</th><th className="th text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td data-label="Cliente" className="td"><p className="font-medium">{d.owner?.fullName}</p><p className="text-xs text-slate-500">{d.owner?.email}</p></td>
                    <td data-label="Documento" className="td"><p className="max-w-[16rem] truncate">{d.originalName}</p><p className="text-xs text-slate-500">{fileSize(d.size)}</p></td>
                    <td data-label="Categoría" className="td text-slate-600">{DOC_CATEGORY_LABELS[d.category]}</td>
                    <td data-label="Subido" className="td text-slate-600">{dateTime(d.createdAt)}</td>
                    <td data-label="Estado" className="td"><DocStatusBadge status={d.status} />{d.status === 'REJECTED' && d.rejectionReason && <p className="mt-1 max-w-[14rem] text-xs text-slate-500">{d.rejectionReason}</p>}</td>
                    <td data-label="Acciones" className="td">
                      <div className="flex justify-end gap-1">
                        <a className="btn-ghost px-2" href={`/api/documents/${d.id}/download`} aria-label={`Descargar ${d.originalName}`}><Download className="h-4 w-4" /></a>
                        <Button variant="ghost" className="px-2 text-green-700" disabled={d.status === 'VALIDATED' || busyId === d.id} onClick={() => void review(d, 'validate')} aria-label={`Validar ${d.originalName}`}><Check className="h-4 w-4" /></Button>
                        <Button variant="ghost" className="px-2 text-red-600" disabled={d.status === 'REJECTED' || busyId === d.id} onClick={() => { setRejecting(d); setReason(''); }} aria-label={`Rechazar ${d.originalName}`}><X className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
        </TableCard>
      )}

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Rechazar documento" footer={<>
        <Button variant="outline" onClick={() => setRejecting(null)}>Cancelar</Button>
        <Button variant="danger" disabled={reason.trim().length < 5} loading={busyId === rejecting?.id} onClick={() => rejecting && void review(rejecting, 'reject')}>Rechazar y notificar</Button>
      </>}>
        <p className="mb-3 text-sm text-slate-600">{rejecting?.originalName} — {rejecting?.owner?.fullName}</p>
        <Field label="Motivo del rechazo" hint="El cliente verá este mensaje. Sé específico para que pueda corregirlo.">{(id) => <textarea id={id} rows={3} maxLength={500} className="input" value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      </Modal>
    </>
  );
}

export default function AdminDocumentsPage() {
  return <Suspense fallback={<PageLoader />}><DocumentsQueue /></Suspense>;
}
