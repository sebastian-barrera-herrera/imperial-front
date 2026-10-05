'use client';

import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SuperOnly } from '@/components/SuperOnly';
import { useToast } from '@/components/toast';
import { Badge, Button, ConfirmModal, EmptyState, ErrorBox, Field, Modal, PageHeader, PageLoader, TableCard, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { Delta } from '@/components/markets';
import { dateTime, money, percent, unitMoney } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { PositionsTab } from './PositionsTab';
import { ValuationsTab } from './ValuationsTab';
import { RISK_LABELS, type Interest, type Opportunity } from '@/lib/types';

type Form = { title: string; summary: string; terms: string; minAmount: string; maxAmount: string; annualRate: string; termMonths: string; risk: Opportunity['risk']; status: Opportunity['status'] };
const EMPTY: Form = { title: '', summary: '', terms: '', minAmount: '', maxAmount: '', annualRate: '', termMonths: '12', risk: 'MEDIUM', status: 'DRAFT' };
const STATUS_LABEL = { DRAFT: 'Borrador', OPEN: 'Abierta', CLOSED: 'Cerrada' } as const;
const STATUS_TONE = { DRAFT: 'slate', OPEN: 'green', CLOSED: 'red' } as const;
const INTEREST_LABEL = { PENDING: 'Pendiente', CONTACTED: 'Contactado', DISCARDED: 'Descartada' } as const;

function Capital() {
  const toast = useToast();
  const [tab, setTab] = useState<'opps' | 'values' | 'positions' | 'interests'>('opps');
  const opps = useFetch<Opportunity[]>('/admin/investments/opportunities');
  const interests = useFetch<Interest[]>('/admin/investments/interests');
  const [editing, setEditing] = useState<Opportunity | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [toDelete, setToDelete] = useState<Opportunity | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  function openForm(o: Opportunity | 'new') {
    setEditing(o);
    setFormError(null);
    setForm(o === 'new' ? EMPTY : { title: o.title, summary: o.summary, terms: o.terms, minAmount: String(Number(o.minAmount)), maxAmount: o.maxAmount ? String(Number(o.maxAmount)) : '', annualRate: String(Number(o.annualRate)), termMonths: String(o.termMonths), risk: o.risk, status: o.status });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const body = { title: form.title.trim(), summary: form.summary.trim(), terms: form.terms.trim(), minAmount: Number(form.minAmount), maxAmount: form.maxAmount ? Number(form.maxAmount) : null, annualRate: Number(form.annualRate), termMonths: Number(form.termMonths), risk: form.risk, status: form.status };
    try {
      if (editing === 'new') await api.post('/admin/investments/opportunities', body);
      else if (editing) await api.patch(`/admin/investments/opportunities/${editing.id}`, body);
      toast.success(form.status === 'OPEN' ? 'Oportunidad guardada. Si es nueva en estado abierta, se notificó a los clientes.' : 'Oportunidad guardada');
      setEditing(null);
      await opps.reload();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.delete(`/admin/investments/opportunities/${toDelete.id}`);
      toast.success('Oportunidad eliminada');
      setToDelete(null);
      await opps.reload();
    } catch (err) {
      toast.error((err as Error).message);
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  }

  async function setInterest(id: string, status: Interest['status']) {
    try { await api.patch(`/admin/investments/interests/${id}`, { status }); await interests.reload(); } catch (e) { toast.error((e as Error).message); }
  }

  const pending = (interests.data ?? []).filter((i) => i.status === 'PENDING').length;

  return (
    <>
      <PageHeader title="Capital e inversión" description="Publica oportunidades y atiende a los clientes interesados."
        actions={<Button onClick={() => openForm('new')}><Plus className="h-4 w-4" /> Nueva oportunidad</Button>} />
      <Tabs tabs={[{ id: 'opps', label: 'Oportunidades', count: opps.data?.length }, { id: 'values', label: 'Valoraciones' }, { id: 'positions', label: 'Inversiones' }, { id: 'interests', label: 'Interesados', count: pending || undefined }]} value={tab} onChange={setTab} />
      <div className="mt-5">
        {tab === 'values' ? (
          opps.loading && !opps.data ? <PageLoader /> : <ValuationsTab opportunities={opps.data ?? []} />
        ) : tab === 'positions' ? (
          opps.loading && !opps.data ? <PageLoader /> : <PositionsTab opportunities={opps.data ?? []} />
        ) : tab === 'opps' ? (
          opps.loading && !opps.data ? <PageLoader /> : opps.error ? <ErrorBox message={opps.error} onRetry={opps.reload} /> : (
            <TableCard>
              {(opps.data ?? []).length === 0 ? <EmptyState icon={<Landmark className="h-10 w-10" />} title="Aún no hay oportunidades">Crea la primera: los clientes solo ven las que estén en estado «Abierta».</EmptyState> : (
                <table className="rtable w-full">
                  <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Oportunidad</th><th className="th">Tasa / plazo</th><th className="th">Monto</th><th className="th">Valor unitario</th><th className="th">Riesgo</th><th className="th">Estado</th><th className="th text-center">Interesados</th><th className="th text-right">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {opps.data!.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td data-label="Oportunidad" className="td max-w-[16rem] font-medium">{o.title}</td>
                        <td data-label="Tasa / plazo" className="td text-slate-600">{percent(Number(o.annualRate))} · {o.termMonths} m</td>
                        <td data-label="Monto" className="td text-slate-600">{money(o.minAmount)}{o.maxAmount ? ` – ${money(o.maxAmount)}` : '+'}</td>
                        <td data-label="Valor unitario" className="td tabular-nums">{o.quote?.latestValue != null ? <>{unitMoney(o.quote.latestValue)}<br /><Delta value={o.quote.sinceInceptionPct} className="text-xs" /></> : '—'}</td>
                        <td data-label="Riesgo" className="td">{RISK_LABELS[o.risk]}</td>
                        <td data-label="Estado" className="td"><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
                        <td data-label="Interesados" className="td text-center">{o._count?.interests ?? 0}</td>
                        <td data-label="Acciones" className="td"><div className="flex justify-end gap-1"><button className="btn-ghost px-2" aria-label={`Editar ${o.title}`} onClick={() => openForm(o)}><Pencil className="h-4 w-4" /></button><button className="btn-ghost px-2 text-red-600" aria-label={`Eliminar ${o.title}`} onClick={() => setToDelete(o)}><Trash2 className="h-4 w-4" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TableCard>
          )
        ) : interests.loading && !interests.data ? <PageLoader /> : (
          <TableCard>
            {(interests.data ?? []).length === 0 ? <EmptyState title="Nadie ha solicitado participar todavía" /> : (
              <table className="rtable w-full">
                <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Cliente</th><th className="th">Oportunidad</th><th className="th text-right">Monto</th><th className="th">Fecha</th><th className="th">Estado</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {interests.data!.map((i) => (
                    <tr key={i.id} className="align-top hover:bg-slate-50">
                      <td data-label="Cliente" className="td"><p className="font-medium">{i.user?.fullName}</p><p className="text-xs text-slate-500">{i.user?.email}</p>{i.message && <p className="mt-1 max-w-xs text-xs italic text-slate-500">“{i.message}”</p>}</td>
                      <td data-label="Oportunidad" className="td">{i.opportunity.title}</td>
                      <td data-label="Monto" className="td text-right tabular-nums">{money(i.amount)}</td>
                      <td data-label="Fecha" className="td text-slate-600">{dateTime(i.createdAt)}</td>
                      <td data-label="Estado" className="td"><select aria-label={`Estado de ${i.user?.fullName}`} className="input w-auto" value={i.status} onChange={(e) => void setInterest(i.id, e.target.value as Interest['status'])}>{Object.entries(INTEREST_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableCard>
        )}
      </div>

      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title={editing === 'new' ? 'Nueva oportunidad' : 'Editar oportunidad'} size="lg" footer={<>
        <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancelar</Button>
        <Button type="submit" form="opp-form" loading={busy}>Guardar</Button>
      </>}>
        <form id="opp-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{formError}</div>}
          <Field label="Título" className="sm:col-span-2">{(id) => <input id={id} required minLength={3} maxLength={160} className="input" value={form.title} onChange={set('title')} />}</Field>
          <Field label="Resumen (visible en la tarjeta)" className="sm:col-span-2">{(id) => <textarea id={id} required minLength={10} maxLength={1000} rows={2} className="input" value={form.summary} onChange={set('summary')} />}</Field>
          <Field label="Términos y condiciones" className="sm:col-span-2">{(id) => <textarea id={id} required minLength={10} maxLength={8000} rows={5} className="input" value={form.terms} onChange={set('terms')} />}</Field>
          <Field label="Monto mínimo (USD)">{(id) => <input id={id} type="number" required min="1" step="0.01" className="input" value={form.minAmount} onChange={set('minAmount')} />}</Field>
          <Field label="Monto máximo (opcional)">{(id) => <input id={id} type="number" min="1" step="0.01" className="input" value={form.maxAmount} onChange={set('maxAmount')} />}</Field>
          <Field label="Tasa nominal anual (%)">{(id) => <input id={id} type="number" required min="0.001" max="100" step="0.001" className="input" value={form.annualRate} onChange={set('annualRate')} />}</Field>
          <Field label="Plazo (meses)">{(id) => <input id={id} type="number" required min="1" max="120" step="1" className="input" value={form.termMonths} onChange={set('termMonths')} />}</Field>
          <Field label="Nivel de riesgo">{(id) => <select id={id} className="input" value={form.risk} onChange={set('risk')}>{Object.entries(RISK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
          <Field label="Estado" hint="Solo las «Abiertas» son visibles para los clientes; al abrir una se les notifica.">{(id) => <select id={id} className="input" value={form.status} onChange={set('status')}>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
        </form>
      </Modal>

      <ConfirmModal open={!!toDelete} title="Eliminar oportunidad" danger confirmLabel="Eliminar" loading={busy} onConfirm={() => void remove()} onClose={() => setToDelete(null)}
        message={<>¿Eliminar <strong>{toDelete?.title}</strong>? Si ya tiene interesados, ciérrala en lugar de eliminarla.</>} />
    </>
  );
}

export default function AdminCapitalPage() {
  return <SuperOnly><Capital /></SuperOnly>;
}
