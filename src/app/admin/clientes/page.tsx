'use client';

import { Briefcase, FileUp, Lock, UserX, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Modal, PageHeader, PageLoader, Pagination, TableCard, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { date, money } from '@/lib/format';
import { qs, useDebounced, useFetch } from '@/lib/hooks';
import { ACCOUNT_TYPE_LABELS, type Paged, type Profile, type Staff } from '@/lib/types';

type Person = { id: string; fullName: string };
type ClientRow = {
  id: string; fullName: string; email: string; status: 'ACTIVE' | 'SUSPENDED'; createdAt: string; country: string | null; phone: string | null; advisor: Person | null;
  depositTotal: string; cases: number; disbursements: number; pendingDocuments: number; deactivatedAt: string | null; deactivationReason: string | null;
};
type ClientDetail = Profile & { status: 'ACTIVE' | 'SUSPENDED'; createdAt: string; deactivatedAt: string | null; deactivationReason: string | null; advisor: Person | null };
type View = 'ACTIVE' | 'SUSPENDED' | 'ALL';

export default function ClientsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isSuper = user?.role === 'SUPERADMIN';
  const [view, setView] = useState<View>('ACTIVE');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const { data, error, loading, reload } = useFetch<Paged<ClientRow>>(`/admin/clients${qs({ search: debounced, status: view === 'ALL' ? undefined : view, page, pageSize: 15 })}`);
  const staff = useFetch<Staff[]>(isSuper ? '/admin/lawyers' : null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [advisorBusy, setAdvisorBusy] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function open(id: string) {
    setDetailError(null);
    try { setDetail(await api.get<ClientDetail>(`/admin/clients/${id}`)); } catch (e) { setDetailError((e as Error).message); }
  }

  async function changeAdvisor(advisorId: string) {
    if (!detail) return;
    setAdvisorBusy(true);
    try {
      const res = await api.patch<{ advisor: Person | null }>(`/admin/clients/${detail.id}/advisor`, { advisorId: advisorId || null });
      setDetail({ ...detail, advisor: res.advisor });
      toast.success(res.advisor ? `Asesor asignado: ${res.advisor.fullName}. El cliente recibió una alerta.` : 'Asesor quitado');
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdvisorBusy(false);
    }
  }

  async function deactivate() {
    if (!detail) return;
    setBusy(true);
    try {
      await api.post(`/admin/clients/${detail.id}/deactivate`, { reason: reason.trim() });
      toast.success('Cliente dado de baja. Perdió el acceso de inmediato.');
      setDeactivating(false);
      setReason('');
      setDetail(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reactivate() {
    if (!detail) return;
    setBusy(true);
    try {
      await api.post(`/admin/clients/${detail.id}/reactivate`);
      toast.success('Acceso restablecido');
      setDetail(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Clientes" description="Directorio de clientes con sus datos. El superadmin puede asignarles asesor, registrar sus depósitos y dar de baja su acceso." />
      <Tabs tabs={[{ id: 'ACTIVE', label: 'Con acceso' }, { id: 'SUSPENDED', label: 'Dados de baja' }, { id: 'ALL', label: 'Todos' }]} value={view} onChange={(v) => { setView(v); setPage(1); }} />
      <div className="my-3"><input className="input max-w-sm" placeholder="Buscar por nombre o correo…" aria-label="Buscar clientes" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {detailError && <ErrorBox message={detailError} />}
      {loading && !data ? <PageLoader /> : (
        <TableCard>
          {data?.items.length === 0 ? <EmptyState icon={<Users className="h-10 w-10" />} title="No se encontraron clientes" /> : (
            <table className="rtable w-full">
              <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Cliente</th><th className="th">País</th><th className="th">Asesor</th><th className="th text-right">Depositado</th><th className="th text-center">Casos</th><th className="th text-center">Desembolsos</th><th className="th text-center">Docs. pendientes</th><th className="th">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td data-label="Cliente" className="td"><button className="text-left" onClick={() => void open(c.id)}><span className="font-medium text-navy-800 underline">{c.fullName}</span><span className="block text-xs text-slate-500">{c.email}{c.phone ? ` · ${c.phone}` : ''}</span></button></td>
                    <td data-label="País" className="td text-slate-600">{c.country ?? '—'}</td>
                    <td data-label="Asesor" className="td text-slate-600">{c.advisor?.fullName ?? '—'}</td>
                    <td data-label="Depositado" className="td text-right tabular-nums">{money(c.depositTotal)}</td>
                    <td data-label="Casos" className="td text-center">{c.cases}</td>
                    <td data-label="Desembolsos" className="td text-center">{c.disbursements}</td>
                    <td data-label="Docs. pendientes" className="td text-center">{c.pendingDocuments ? <Badge tone="amber">{c.pendingDocuments}</Badge> : 0}</td>
                    <td data-label="Estado" className="td">{c.status === 'ACTIVE' ? <Badge tone="green">Con acceso</Badge> : <Badge tone="red">De baja</Badge>}<span className="mt-0.5 block text-xs text-slate-500">Registro {date(c.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
        </TableCard>
      )}

      <Modal open={!!detail && !deactivating} onClose={() => setDetail(null)} title={detail?.fullName ?? ''} size="lg">
        {detail && (
          <div className="space-y-5">
            <p className="flex items-center gap-2 rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-900"><Lock className="h-3.5 w-3.5" aria-hidden /> Esta consulta de datos personales queda registrada en la auditoría.</p>
            {detail.status === 'SUSPENDED' && (
              <p role="status" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900"><strong>Dado de baja{detail.deactivatedAt ? ` el ${date(detail.deactivatedAt)}` : ''}.</strong> No puede entrar a la plataforma; sus datos se conservan.{detail.deactivationReason ? <> Motivo: {detail.deactivationReason}</> : null}</p>
            )}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Correo</dt><dd>{detail.email}</dd></div>
              <div><dt className="text-slate-500">Documento de identidad</dt><dd>{detail.cedula ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Teléfono</dt><dd>{detail.phone ?? '—'}</dd></div>
              <div><dt className="text-slate-500">País</dt><dd>{detail.country ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Ciudad / dirección</dt><dd>{[detail.city, detail.address].filter(Boolean).join(' · ') || '—'}</dd></div>
              <div><dt className="text-slate-500">Banco</dt><dd>{detail.bankName ?? '—'} {detail.accountType ? `(${ACCOUNT_TYPE_LABELS[detail.accountType] ?? detail.accountType})` : ''}</dd></div>
              <div><dt className="text-slate-500">Cuenta</dt><dd>{detail.accountNumberMasked ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Cliente desde</dt><dd>{date(detail.createdAt)}</dd></div>
            </dl>

            {isSuper ? (
              <Field label="Asesor profesional" hint="Es el nombre que el cliente ve en su panel. Recibe una alerta al asignarlo.">
                {(fid) => (
                  <select id={fid} className="input max-w-sm" value={detail.advisor?.id ?? ''} disabled={advisorBusy || staff.loading} onChange={(e) => void changeAdvisor(e.target.value)}>
                    <option value="">Sin asesor asignado</option>
                    {(staff.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.fullName}{s.role === 'SUPERADMIN' ? ' (superadmin)' : ''}</option>)}
                  </select>
                )}
              </Field>
            ) : <p className="text-sm"><span className="text-slate-500">Asesor profesional: </span>{detail.advisor?.fullName ?? '—'}</p>}

            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Link className="btn-outline" href={`/admin/documentos?ownerId=${detail.id}`}>Ver documentos</Link>
              <Link className="btn-outline" href={`/admin/desembolsos?clientId=${detail.id}`}>Ver desembolsos</Link>
              <Link className="btn-outline" href={`/admin/casos?clientId=${detail.id}`}><Briefcase className="h-4 w-4" /> Ver casos</Link>
              {isSuper && <Link className="btn-primary" href={`/admin/clientes/${detail.id}/depositos`}><Wallet className="h-4 w-4" /> Depósitos</Link>}
              {isSuper && <Link className="btn-primary" href={`/admin/clientes/${detail.id}/documentos`}><FileUp className="h-4 w-4" /> Documentos del despacho</Link>}
            </div>
            {isSuper && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <p className="text-sm text-slate-600">{detail.status === 'ACTIVE' ? 'Dar de baja quita el acceso al instante y cierra sus sesiones. Sus datos y su historial se conservan.' : 'Reactivar le devuelve el acceso con su misma contraseña.'}</p>
                {detail.status === 'ACTIVE'
                  ? <Button variant="danger" onClick={() => { setReason(''); setDeactivating(true); }}><UserX className="h-4 w-4" aria-hidden /> Dar de baja</Button>
                  : <Button variant="outline" loading={busy} onClick={() => void reactivate()}>Reactivar acceso</Button>}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={deactivating} onClose={() => !busy && setDeactivating(false)} title={`Dar de baja a ${detail?.fullName ?? ''}`} footer={<>
        <Button variant="outline" onClick={() => setDeactivating(false)} disabled={busy}>Cancelar</Button>
        <Button variant="danger" loading={busy} disabled={reason.trim().length < 3} onClick={() => void deactivate()}>Dar de baja y quitar acceso</Button>
      </>}>
        <p className="mb-3 text-sm text-slate-600">El cliente dejará de poder entrar y sus sesiones abiertas se cerrarán de inmediato. No se borra nada: podrás reactivarlo cuando quieras.</p>
        <Field label="Motivo de la baja (obligatorio)" hint="Queda registrado en la auditoría; el cliente no lo ve.">{(fid) => <textarea id={fid} rows={3} maxLength={300} className="input" value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      </Modal>
    </>
  );
}
