'use client';

import { Download, History } from 'lucide-react';
import { useState } from 'react';
import { SuperOnly } from '@/components/SuperOnly';
import { EmptyState, ErrorBox, PageHeader, PageLoader, Pagination, TableCard } from '@/components/ui';
import { dateTime } from '@/lib/format';
import { qs, useDebounced, useFetch } from '@/lib/hooks';
import { auditLabel, type Paged } from '@/lib/types';

type Entry = { id: string; actorEmail: string | null; action: string; entity: string; entityId: string | null; ip: string | null; metadata: unknown; createdAt: string };

function Audit() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search);
  const debouncedAction = useDebounced(action);
  const { data, error, loading, reload } = useFetch<Paged<Entry>>(`/admin/audit${qs({ search: debouncedSearch, action: debouncedAction.trim().toUpperCase(), page, pageSize: 25 })}`);

  return (
    <>
      <PageHeader title="Auditoría" description="Registro inmutable de las acciones sensibles: accesos, cambios de estado, consultas de datos personales y exportaciones."
        actions={<a href="/api/admin/reports/audit.csv" className="btn-outline"><Download className="h-4 w-4" /> Exportar CSV</a>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Filtrar por correo del usuario…" aria-label="Filtrar por usuario" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <input className="input max-w-xs" placeholder="Acción exacta, p. ej. DOCUMENT_VALIDATED" aria-label="Filtrar por acción" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} />
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <PageLoader /> : (
        <TableCard>
          {data?.items.length === 0 ? <EmptyState icon={<History className="h-10 w-10" />} title="Sin registros con estos filtros" /> : (
            <table className="rtable w-full">
              <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Fecha</th><th className="th">Usuario</th><th className="th">Acción</th><th className="th">Entidad</th><th className="th">IP</th><th className="th">Detalle</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((a) => (
                  <tr key={a.id} className="align-top hover:bg-slate-50">
                    <td data-label="Fecha" className="td whitespace-nowrap text-slate-600">{dateTime(a.createdAt)}</td>
                    <td data-label="Usuario" className="td">{a.actorEmail ?? <span className="text-slate-500">—</span>}</td>
                    <td data-label="Acción" className="td"><p className="text-sm font-medium">{auditLabel(a.action)}</p><p className="font-mono text-[11px] text-slate-500">{a.action}</p></td>
                    <td data-label="Entidad" className="td text-slate-600">{a.entity}{a.entityId && <span className="block max-w-[10rem] truncate text-xs text-slate-500">{a.entityId}</span>}</td>
                    <td data-label="IP" className="td text-xs text-slate-500">{a.ip ?? '—'}</td>
                    <td data-label="Detalle" className="td max-w-xs break-words text-xs text-slate-500">{a.metadata ? JSON.stringify(a.metadata) : ''}</td>
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

export default function AuditPage() {
  return <SuperOnly><Audit /></SuperOnly>;
}
