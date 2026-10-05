'use client';

import { Briefcase, Download, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { ClientPicker } from '@/components/ClientPicker';
import { useToast } from '@/components/toast';
import { Badge, Button, CaseStatusBadge, EmptyState, ErrorBox, Field, Modal, PageHeader, PageLoader, Pagination, TableCard } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { date, money } from '@/lib/format';
import { qs, useDebounced, useFetch } from '@/lib/hooks';
import { CASE_STAGE_LABELS, CASE_STATUS_LABELS, DOC_CATEGORY_LABELS, STAGE_ORDER, type CaseItem, type CaseStage, type CaseStatus, type DocumentCategory, type Paged } from '@/lib/types';

type Req = { label: string; category: DocumentCategory };
type Lawyer = { id: string; fullName: string; role: string };

function CasesList() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const clientParam = useSearchParams().get('clientId') ?? undefined;
  const [status, setStatus] = useState<CaseStatus | ''>('');
  const [stage, setStage] = useState<CaseStage | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const { data, error, loading, reload } = useFetch<Paged<CaseItem>>(`/admin/cases${qs({ status, stage, search: debounced, clientId: clientParam, page, pageSize: 15 })}`);
  const lawyers = useFetch<Lawyer[]>(user?.role === 'SUPERADMIN' ? '/admin/lawyers' : null);

  const [open, setOpen] = useState(false);
  const [client, setClient] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [lawyerId, setLawyerId] = useState('');
  const [reqs, setReqs] = useState<Req[]>([{ label: 'Documento de identidad', category: 'IDENTITY' }]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!client) return;
    setBusy(true);
    setFormError(null);
    try {
      const created = await api.post<CaseItem>('/admin/cases', {
        clientId: client.id, title: title.trim(), description: description.trim() || undefined, amountClaimed: amount ? Number(amount) : undefined,
        nextSteps: nextSteps.trim() || undefined, lawyerId: lawyerId || undefined, requirements: reqs.filter((r) => r.label.trim()),
      });
      toast.success(`Caso ${created.number} creado`);
      router.push(`/admin/casos/${created.id}`);
    } catch (err) {
      setFormError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Casos" description={user?.role === 'SUPERADMIN' ? 'Todos los casos del despacho.' : 'Los casos que tienes asignados.'}
        actions={<><a href="/api/admin/reports/cases.csv" className="btn-outline"><Download className="h-4 w-4" /> Exportar CSV</a><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nuevo caso</Button></>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <select aria-label="Estado" className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value as CaseStatus | ''); setPage(1); }}><option value="">Todos los estados</option>{Object.entries(CASE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select aria-label="Etapa" className="input w-auto" value={stage} onChange={(e) => { setStage(e.target.value as CaseStage | ''); setPage(1); }}><option value="">Todas las etapas</option>{STAGE_ORDER.map((s) => <option key={s} value={s}>{CASE_STAGE_LABELS[s]}</option>)}</select>
        <input className="input max-w-xs" placeholder="Buscar número, título o cliente…" aria-label="Buscar" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <PageLoader /> : (
        <TableCard>
          {data?.items.length === 0 ? <EmptyState icon={<Briefcase className="h-10 w-10" />} title="No hay casos con estos filtros" /> : (
            <table className="rtable w-full">
              <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Caso</th><th className="th">Cliente</th><th className="th">Etapa</th><th className="th">Abogado</th><th className="th text-right">Reclamado</th><th className="th">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td data-label="Caso" className="td"><Link className="font-medium text-navy-700 underline" href={`/admin/casos/${c.id}`}>{c.number}</Link><p className="max-w-[16rem] truncate text-xs text-slate-500">{c.title}</p></td>
                    <td data-label="Cliente" className="td">{c.client?.fullName}</td>
                    <td data-label="Etapa" className="td"><Badge tone="navy">{CASE_STAGE_LABELS[c.stage]}</Badge></td>
                    <td data-label="Abogado" className="td text-slate-600">{c.lawyer?.fullName ?? <span className="text-amber-700">Sin asignar</span>}</td>
                    <td data-label="Reclamado" className="td text-right tabular-nums">{money(c.amountClaimed, c.currency)}</td>
                    <td data-label="Estado" className="td"><CaseStatusBadge status={c.status} /><p className="mt-0.5 text-xs text-slate-500">{date(c.updatedAt)}</p></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
        </TableCard>
      )}

      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Nuevo caso" size="lg" footer={<>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
        <Button type="submit" form="new-case" loading={busy} disabled={!client || title.trim().length < 3}>Crear caso</Button>
      </>}>
        <form id="new-case" onSubmit={create} className="space-y-4">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}
          <div><span className="mb-1 block text-sm font-medium text-slate-700">Cliente</span><ClientPicker value={client} onChange={setClient} /></div>
          <Field label="Título del caso">{(id) => <input id={id} required minLength={3} maxLength={160} className="input" value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
          <Field label="Descripción (visible para el cliente)">{(id) => <textarea id={id} rows={2} maxLength={2000} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monto reclamado (USD)">{(id) => <input id={id} type="number" min="0" step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
            {user?.role === 'SUPERADMIN' && <Field label="Abogado responsable">{(id) => <select id={id} className="input" value={lawyerId} onChange={(e) => setLawyerId(e.target.value)}><option value="">Sin asignar</option>{lawyers.data?.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}</select>}</Field>}
          </div>
          <Field label="Próximos pasos">{(id) => <textarea id={id} rows={2} maxLength={1000} className="input" value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} />}</Field>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">Documentos requeridos al cliente</legend>
            <div className="space-y-2">
              {reqs.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input aria-label={`Documento ${i + 1}`} className="input" placeholder="Ej. Contrato firmado" value={r.label} maxLength={120} onChange={(e) => setReqs(reqs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <select aria-label={`Categoría ${i + 1}`} className="input w-auto" value={r.category} onChange={(e) => setReqs(reqs.map((x, j) => (j === i ? { ...x, category: e.target.value as DocumentCategory } : x)))}>{Object.entries(DOC_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  <button type="button" className="btn-ghost px-2 text-red-600" aria-label="Quitar documento" onClick={() => setReqs(reqs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {reqs.length < 20 && <button type="button" className="text-sm font-medium text-navy-700 underline" onClick={() => setReqs([...reqs, { label: '', category: 'LEGAL' }])}>+ Añadir documento</button>}
            </div>
          </fieldset>
        </form>
      </Modal>
    </>
  );
}

export default function AdminCasesPage() {
  return <Suspense fallback={<PageLoader />}><CasesList /></Suspense>;
}
