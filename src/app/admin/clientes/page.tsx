'use client';

import { Briefcase, Lock, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Card, EmptyState, ErrorBox, Modal, PageHeader, PageLoader, Pagination, TableCard } from '@/components/ui';
import { api } from '@/lib/api';
import { date } from '@/lib/format';
import { qs, useDebounced, useFetch } from '@/lib/hooks';
import { ACCOUNT_TYPE_LABELS, type Paged, type Profile } from '@/lib/types';

type ClientRow = { id: string; fullName: string; email: string; status: 'ACTIVE' | 'SUSPENDED'; createdAt: string; cases: number; disbursements: number; pendingDocuments: number };
type ClientDetail = Profile & { status: string; createdAt: string };

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const { data, error, loading, reload } = useFetch<Paged<ClientRow>>(`/admin/clients${qs({ search: debounced, page, pageSize: 15 })}`);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function open(id: string) {
    setDetailError(null);
    try { setDetail(await api.get<ClientDetail>(`/admin/clients/${id}`)); } catch (e) { setDetailError((e as Error).message); }
  }

  return (
    <>
      <PageHeader title="Clientes" description="Directorio de clientes registrados en la plataforma." />
      <div className="mb-3"><input className="input max-w-sm" placeholder="Buscar por nombre o correo…" aria-label="Buscar clientes" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {detailError && <ErrorBox message={detailError} />}
      {loading && !data ? <PageLoader /> : (
        <TableCard>
          {data?.items.length === 0 ? <EmptyState icon={<Users className="h-10 w-10" />} title="No se encontraron clientes" /> : (
            <table className="rtable w-full">
              <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Cliente</th><th className="th">Registro</th><th className="th text-center">Casos</th><th className="th text-center">Desembolsos</th><th className="th text-center">Docs. pendientes</th><th className="th">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td data-label="Cliente" className="td"><button className="text-left" onClick={() => void open(c.id)}><span className="font-medium text-navy-800 underline">{c.fullName}</span><span className="block text-xs text-slate-500">{c.email}</span></button></td>
                    <td data-label="Registro" className="td text-slate-600">{date(c.createdAt)}</td>
                    <td data-label="Casos" className="td text-center">{c.cases}</td>
                    <td data-label="Desembolsos" className="td text-center">{c.disbursements}</td>
                    <td data-label="Docs. pendientes" className="td text-center">{c.pendingDocuments ? <Badge tone="amber">{c.pendingDocuments}</Badge> : 0}</td>
                    <td data-label="Estado" className="td">{c.status === 'ACTIVE' ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Suspendido</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
        </TableCard>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.fullName ?? ''} size="lg">
        {detail && (
          <div className="space-y-5">
            <p className="flex items-center gap-2 rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-900"><Lock className="h-3.5 w-3.5" aria-hidden /> Esta consulta de datos personales queda registrada en la auditoría.</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Correo</dt><dd>{detail.email}</dd></div>
              <div><dt className="text-slate-500">Cédula</dt><dd>{detail.cedula ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Teléfono</dt><dd>{detail.phone ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Ciudad / dirección</dt><dd>{[detail.city, detail.address].filter(Boolean).join(' · ') || '—'}</dd></div>
              <div><dt className="text-slate-500">Banco</dt><dd>{detail.bankName ?? '—'} {detail.accountType ? `(${ACCOUNT_TYPE_LABELS[detail.accountType] ?? detail.accountType})` : ''}</dd></div>
              <div><dt className="text-slate-500">Cuenta</dt><dd>{detail.accountNumberMasked ?? '—'}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Link className="btn-outline" href={`/admin/documentos?ownerId=${detail.id}`}>Ver documentos</Link>
              <Link className="btn-outline" href={`/admin/desembolsos?clientId=${detail.id}`}>Ver desembolsos</Link>
              <Link className="btn-outline" href={`/admin/casos?clientId=${detail.id}`}><Briefcase className="h-4 w-4" /> Ver casos</Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
