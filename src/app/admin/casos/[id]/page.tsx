'use client';

import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { StageStepper } from '@/components/StageStepper';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, CaseStatusBadge, DisbursementBadge, ErrorBox, Field, PageLoader, RequirementBadge, Timeline } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dateTime, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { CASE_STAGE_LABELS, CASE_STATUS_LABELS, DOC_CATEGORY_LABELS, STAGE_ORDER, type CaseItem, type CaseStage, type CaseStatus, type DocumentCategory } from '@/lib/types';

type Lawyer = { id: string; fullName: string };

export default function AdminCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { user } = useAuth();
  const { data, error, loading, setData } = useFetch<CaseItem>(`/admin/cases/${id}`);
  const lawyers = useFetch<Lawyer[]>(user?.role === 'SUPERADMIN' ? '/admin/lawyers' : null);

  const [stage, setStage] = useState<CaseStage>('INTAKE');
  const [status, setStatus] = useState<CaseStatus>('OPEN');
  const [lawyerId, setLawyerId] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evBusy, setEvBusy] = useState(false);
  const [reqLabel, setReqLabel] = useState('');
  const [reqCategory, setReqCategory] = useState<DocumentCategory>('LEGAL');

  useEffect(() => {
    if (!data) return;
    setStage(data.stage); setStatus(data.status); setLawyerId(data.lawyer?.id ?? ''); setNextSteps(data.nextSteps ?? ''); setAmount(data.amountClaimed ? String(Number(data.amountClaimed)) : '');
  }, [data]);

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'Caso no encontrado'} />;

  const run = async <T,>(fn: () => Promise<T>, ok: string) => {
    try { const r = await fn(); toast.success(ok); return r; } catch (e) { toast.error((e as Error).message); return null; }
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updated = await run(() => api.patch<CaseItem>(`/admin/cases/${id}`, {
      stage, status, nextSteps, lawyerId: user?.role === 'SUPERADMIN' ? lawyerId : undefined, amountClaimed: amount ? Number(amount) : undefined,
    }), 'Caso actualizado y cliente notificado');
    if (updated) setData(updated);
    setSaving(false);
  }

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    setEvBusy(true);
    const updated = await run(() => api.post<CaseItem>(`/admin/cases/${id}/events`, { title: evTitle.trim(), description: evDesc.trim() || undefined }), 'Novedad publicada y cliente notificado');
    if (updated) { setData(updated); setEvTitle(''); setEvDesc(''); }
    setEvBusy(false);
  }

  async function addReq(e: FormEvent) {
    e.preventDefault();
    const updated = await run(() => api.post<CaseItem>(`/admin/cases/${id}/requirements`, { label: reqLabel.trim(), category: reqCategory }), 'Documento requerido añadido y cliente notificado');
    if (updated) { setData(updated); setReqLabel(''); }
  }

  async function removeReq(reqId: string) {
    const updated = await run(() => api.delete<CaseItem>(`/admin/cases/${id}/requirements/${reqId}`), 'Requisito eliminado');
    if (updated) setData(updated);
  }

  return (
    <>
      <Link href="/admin/casos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-800"><ArrowLeft className="h-4 w-4" /> Volver a casos</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><Badge tone="navy">{data.number}</Badge><h1 className="mt-2 text-2xl font-semibold">{data.title}</h1>
          <p className="mt-1 text-sm text-slate-600">Cliente: <strong>{data.client?.fullName}</strong> · {data.client?.email} · Reclamado {money(data.amountClaimed, data.currency)}</p></div>
        <CaseStatusBadge status={data.status} />
      </div>

      <Card className="p-5"><StageStepper stage={data.stage} /></Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Gestionar caso</h2>
            <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Etapa">{(fid) => <select id={fid} className="input" value={stage} onChange={(e) => setStage(e.target.value as CaseStage)}>{STAGE_ORDER.map((s) => <option key={s} value={s}>{CASE_STAGE_LABELS[s]}</option>)}</select>}</Field>
              <Field label="Estado">{(fid) => <select id={fid} className="input" value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)}>{Object.entries(CASE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
              {user?.role === 'SUPERADMIN' && <Field label="Abogado responsable">{(fid) => <select id={fid} className="input" value={lawyerId} onChange={(e) => setLawyerId(e.target.value)}><option value="">Sin asignar</option>{lawyers.data?.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}</select>}</Field>}
              <Field label="Monto reclamado (USD)">{(fid) => <input id={fid} type="number" min="0" step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
              <Field label="Próximos pasos (visible para el cliente)" className="sm:col-span-2">{(fid) => <textarea id={fid} rows={3} maxLength={1000} className="input" value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} />}</Field>
              <div className="sm:col-span-2"><Button type="submit" loading={saving}>Guardar y notificar al cliente</Button></div>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold">Publicar novedad</h2>
            <form onSubmit={addEvent} className="mt-4 space-y-3">
              <Field label="Título">{(fid) => <input id={fid} required minLength={3} maxLength={160} className="input" value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="Ej. Se radicó la demanda" />}</Field>
              <Field label="Detalle (opcional)">{(fid) => <textarea id={fid} rows={2} maxLength={1000} className="input" value={evDesc} onChange={(e) => setEvDesc(e.target.value)} />}</Field>
              <Button type="submit" loading={evBusy} disabled={evTitle.trim().length < 3}>Publicar en la línea de tiempo</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold">Documentos requeridos</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {(data.requirements ?? []).length === 0 && <li className="py-2 text-sm text-slate-500">Sin requisitos definidos.</li>}
              {data.requirements?.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5"><div><p className="text-sm font-medium">{r.label}</p><p className="text-xs text-slate-500">{r.categoryLabel}</p></div>
                  <div className="flex items-center gap-2"><RequirementBadge state={r.state} /><button className="btn-ghost px-2 text-red-600" aria-label={`Quitar ${r.label}`} onClick={() => void removeReq(r.id)}><Trash2 className="h-4 w-4" /></button></div></li>
              ))}
            </ul>
            <form onSubmit={addReq} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input aria-label="Nuevo documento requerido" required minLength={2} maxLength={120} className="input" placeholder="Ej. Poder firmado" value={reqLabel} onChange={(e) => setReqLabel(e.target.value)} />
              <select aria-label="Categoría" className="input sm:w-auto" value={reqCategory} onChange={(e) => setReqCategory(e.target.value as DocumentCategory)}>{Object.entries(DOC_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <Button type="submit" variant="outline" disabled={reqLabel.trim().length < 2}>Añadir</Button>
            </form>
          </Card>

          {(data.disbursements ?? []).length > 0 && (
            <Card className="p-5"><h2 className="text-lg font-semibold">Desembolsos del caso</h2>
              <ul className="mt-3 divide-y divide-slate-100">{data.disbursements!.map((d) => <li key={d.id}><Link href={`/admin/desembolsos/${d.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50"><div><p className="text-sm font-medium">{d.code}</p><p className="text-xs text-slate-500">{money(d.amount, data.currency)} · {dateTime(d.createdAt)}</p></div><DisbursementBadge status={d.status} /></Link></li>)}</ul></Card>
          )}
        </div>

        <Card className="h-fit p-5 lg:col-span-2"><h2 className="mb-4 text-lg font-semibold">Línea de tiempo</h2>
          <Timeline items={(data.events ?? []).map((e) => ({ id: e.id, title: e.title, description: e.description, meta: e.actorName ?? undefined, at: dateTime(e.createdAt) }))} /></Card>
      </div>
    </>
  );
}
