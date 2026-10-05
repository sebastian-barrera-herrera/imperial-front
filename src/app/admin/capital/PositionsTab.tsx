'use client';

import { LineChart, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ClientPicker } from '@/components/ClientPicker';
import { Delta } from '@/components/markets';
import { useToast } from '@/components/toast';
import { Badge, Button, ConfirmModal, EmptyState, ErrorBox, Field, Modal, PageLoader, TableCard } from '@/components/ui';
import { api } from '@/lib/api';
import { dateOnly, money, unitMoney } from '@/lib/format';
import { qs, useFetch } from '@/lib/hooks';
import type { AdminPosition, Opportunity } from '@/lib/types';

const localToday = () => new Date().toLocaleDateString('en-CA');

export function PositionsTab({ opportunities }: { opportunities: Opportunity[] }) {
  const toast = useToast();
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'REDEEMED'>('');
  const { data, error, loading, reload } = useFetch<AdminPosition[]>(`/admin/investments/positions${qs({ status })}`);
  const available = opportunities.filter((o) => o.status !== 'DRAFT');

  const [creating, setCreating] = useState(false);
  const [client, setClient] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [opportunityId, setOpportunityId] = useState('');
  const [amount, setAmount] = useState('');
  const [investedAt, setInvestedAt] = useState(localToday());
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<AdminPosition | null>(null);
  const [redeemDate, setRedeemDate] = useState(localToday());

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!client) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.post('/admin/investments/positions', { userId: client.id, opportunityId, amount: Number(amount), investedAt });
      toast.success('Inversión registrada y cliente notificado');
      setCreating(false); setClient(null); setAmount('');
      await reload();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    if (!redeeming) return;
    setBusy(true);
    try {
      await api.post(`/admin/investments/positions/${redeeming.id}/redeem`, { date: redeemDate });
      toast.success('Inversión rescatada y cliente notificado');
      setRedeeming(null);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <select aria-label="Estado" className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as '' | 'ACTIVE' | 'REDEEMED')}>
          <option value="">Todas</option><option value="ACTIVE">Activas</option><option value="REDEEMED">Rescatadas</option>
        </select>
        <div className="flex gap-2">
          <a href="/api/admin/reports/positions.csv" className="btn-outline">Exportar CSV</a>
          <Button onClick={() => { setCreating(true); setFormError(null); setOpportunityId(available[0]?.id ?? ''); }} disabled={available.length === 0}><Plus className="h-4 w-4" /> Registrar inversión</Button>
        </div>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <PageLoader /> : (
        <TableCard>
          {(data ?? []).length === 0 ? <EmptyState icon={<LineChart className="h-10 w-10" />} title="Sin inversiones registradas">Cuando un cliente formalice su participación, regístrala aquí para que vea su portafolio.</EmptyState> : (
            <table className="rtable w-full">
              <caption className="sr-only">Inversiones de los clientes</caption>
              <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Inversión</th><th className="th">Cliente</th><th className="th text-right">Capital</th><th className="th text-right">Valor actual</th><th className="th text-right">Ganancia</th><th className="th">Estado</th><th className="th text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data!.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td data-label="Inversión" className="td"><p className="font-medium">{p.code}</p><p className="max-w-[14rem] truncate text-xs text-slate-500">{p.opportunity.title} · {dateOnly(p.investedAt)}</p></td>
                    <td data-label="Cliente" className="td">{p.user.fullName}<p className="text-xs text-slate-500">{p.user.email}</p></td>
                    <td data-label="Capital" className="td text-right tabular-nums">{money(p.amount)}<p className="text-xs text-slate-500">{p.units.toLocaleString('es-US', { maximumFractionDigits: 4 })} u. a {unitMoney(p.unitCost)}</p></td>
                    <td data-label="Valor actual" className="td text-right font-medium tabular-nums">{money(p.currentValue)}<p className="text-xs text-slate-500">{unitMoney(p.currentUnitValue)} / u.</p></td>
                    <td data-label="Ganancia" className="td text-right"><Delta value={p.pnl} kind="money" /><br /><Delta value={p.returnPct} className="text-xs" /></td>
                    <td data-label="Estado" className="td">{p.status === 'ACTIVE' ? <Badge tone="green">Activa</Badge> : <Badge>Rescatada {p.redeemedAt ? dateOnly(p.redeemedAt) : ''}</Badge>}</td>
                    <td data-label="Acciones" className="td text-right">{p.status === 'ACTIVE' && <Button variant="outline" onClick={() => { setRedeeming(p); setRedeemDate(localToday()); }}>Rescatar</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>
      )}

      <Modal open={creating} onClose={() => !busy && setCreating(false)} title="Registrar inversión" footer={<>
        <Button variant="outline" onClick={() => setCreating(false)} disabled={busy}>Cancelar</Button>
        <Button type="submit" form="new-position" loading={busy} disabled={!client || !opportunityId || !amount}>Registrar y notificar</Button>
      </>}>
        <form id="new-position" onSubmit={create} className="space-y-4">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}
          <div><span className="mb-1 block text-sm font-medium text-slate-700">Cliente</span><ClientPicker value={client} onChange={setClient} /></div>
          <Field label="Oportunidad">{(id) => <select id={id} className="input" value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>{available.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Capital aportado (USD)">{(id) => <input id={id} type="number" required min="1" step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
            <Field label="Fecha de inversión" hint="Define el valor unitario de compra.">{(id) => <input id={id} type="date" required max={localToday()} className="input" value={investedAt} onChange={(e) => setInvestedAt(e.target.value)} />}</Field>
          </div>
          <p className="text-xs text-slate-500">Las unidades se calculan como capital ÷ valor unitario vigente en la fecha de inversión.</p>
        </form>
      </Modal>

      <ConfirmModal open={!!redeeming} title="Rescatar inversión" confirmLabel="Rescatar y notificar" loading={busy} onConfirm={() => void redeem()} onClose={() => setRedeeming(null)}
        message={<div className="space-y-3">
          <p>Se rescata <strong>{redeeming?.code}</strong> de {redeeming?.user.fullName} al valor unitario vigente en la fecha elegida. El resultado queda congelado como ganancia realizada.</p>
          <Field label="Fecha de rescate">{(id) => <input id={id} type="date" max={localToday()} className="input" value={redeemDate} onChange={(e) => setRedeemDate(e.target.value)} />}</Field>
        </div>} />
    </>
  );
}
