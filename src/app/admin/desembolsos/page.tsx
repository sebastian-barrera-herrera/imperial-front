'use client';

import { Banknote, Download } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { DisbursementBadge, EmptyState, ErrorBox, PageHeader, PageLoader, Pagination, TableCard } from '@/components/ui';
import { dateTime, money } from '@/lib/format';
import { qs, useDebounced, useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { DISBURSEMENT_STATUS_LABELS, type Disbursement, type DisbursementStatus, type Paged } from '@/lib/types';

function List() {
  const clientId = useSearchParams().get('clientId') ?? undefined;
  const [status, setStatus] = useState<DisbursementStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const { data, error, loading, reload } = useFetch<Paged<Disbursement>>(`/admin/disbursements${qs({ status, search: debounced, clientId, page, pageSize: 15 })}`);
  useOnLive(() => void reload());

  return (
    <>
      <PageHeader title="Solicitudes de desembolso" description="Gestiona el estado de cada solicitud: el cliente recibe una alerta con cada cambio."
        actions={<a href="/api/admin/reports/disbursements.csv" className="btn-outline"><Download className="h-4 w-4" /> Exportar CSV</a>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <select aria-label="Estado" className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value as DisbursementStatus | ''); setPage(1); }}>
          <option value="">Todos los estados</option>{Object.entries(DISBURSEMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input className="input max-w-xs" placeholder="Buscar código, cliente o correo…" aria-label="Buscar" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        {clientId && <span className="self-center text-sm text-slate-500">Filtrado por un cliente.</span>}
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <PageLoader /> : (
        <TableCard>
          {data?.items.length === 0 ? <EmptyState icon={<Banknote className="h-10 w-10" />} title="No hay solicitudes con estos filtros" /> : (
            <table className="rtable w-full">
              <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Código</th><th className="th">Cliente</th><th className="th">Fecha</th><th className="th text-right">Monto</th><th className="th text-center">Docs.</th><th className="th">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td data-label="Código" className="td font-medium"><Link className="text-navy-700 underline" href={`/admin/desembolsos/${d.id}`}>{d.code}</Link></td>
                    <td data-label="Cliente" className="td"><p>{d.client?.fullName}</p><p className="text-xs text-slate-500">{d.client?.email}</p></td>
                    <td data-label="Fecha" className="td text-slate-600">{dateTime(d.createdAt)}</td>
                    <td data-label="Monto" className="td text-right tabular-nums">{money(d.amount, d.currency)}</td>
                    <td data-label="Docs." className="td text-center">{d._count?.documents ?? 0}</td>
                    <td data-label="Estado" className="td"><DisbursementBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
        </TableCard>
      )}
    </>
  );
}

export default function AdminDisbursementsPage() {
  return <Suspense fallback={<PageLoader />}><List /></Suspense>;
}
