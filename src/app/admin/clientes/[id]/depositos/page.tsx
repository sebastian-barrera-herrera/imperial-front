'use client';

import { ArrowLeft, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { SuperOnly } from '@/components/SuperOnly';
import { useToast } from '@/components/toast';
import { Button, Card, ConfirmModal, EmptyState, ErrorBox, Field, Modal, PageHeader, PageLoader, StatTile, TableCard } from '@/components/ui';
import { api } from '@/lib/api';
import { dateOnly, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { AdminDepositsView, Deposit } from '@/lib/types';

type Form = { amount: string; depositedAt: string; reference: string; note: string };
const todayLocal = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const blank = (): Form => ({ amount: '', depositedAt: todayLocal(), reference: '', note: '' });

function Deposits() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch<AdminDepositsView>(`/admin/clients/${id}/deposits`);
  const [editing, setEditing] = useState<Deposit | 'new' | null>(null);
  const [form, setForm] = useState<Form>(blank());
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Deposit | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'Cliente no encontrado'} onRetry={reload} />;

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const open = (d: Deposit | 'new') => {
    setEditing(d);
    setFormError(null);
    setForm(d === 'new' ? blank() : { amount: String(Number(d.amount)), depositedAt: d.depositedAt, reference: d.reference ?? '', note: d.note ?? '' });
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const body = { amount: Number(form.amount), depositedAt: form.depositedAt, reference: form.reference.trim(), note: form.note.trim() };
    try {
      if (editing === 'new') await api.post(`/admin/clients/${id}/deposits`, body);
      else if (editing) await api.patch(`/admin/deposits/${editing.id}`, body);
      toast.success(editing === 'new' ? 'Depósito registrado. El cliente recibió una alerta.' : 'Depósito actualizado');
      setEditing(null);
      await reload();
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
      await api.delete(`/admin/deposits/${toDelete.id}`);
      toast.success('Depósito eliminado');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const valid = Number(form.amount) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(form.depositedAt);

  return (
    <>
      <Link href="/admin/clientes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-800"><ArrowLeft className="h-4 w-4" aria-hidden /> Volver a clientes</Link>
      <PageHeader title="Depósitos del cliente" description={`Depósitos registrados a nombre de ${data.client.fullName} (${data.client.email}). El cliente ve el total y el historial en su panel. Registra cada uno con su referencia bancaria para poder conciliarlo; todo cambio queda auditado.`}
        actions={<Button onClick={() => open('new')}><Plus className="h-4 w-4" aria-hidden /> Registrar depósito</Button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3"><StatTile label="Valor depositado" value={money(data.total, data.currency)} hint={`${data.items.length} ${data.items.length === 1 ? 'depósito' : 'depósitos'}`} /></div>

      {data.items.length === 0 ? (
        <Card><EmptyState icon={<Wallet className="h-10 w-10" />} title="Aún no hay depósitos registrados">Registra el primero con el botón de arriba.</EmptyState></Card>
      ) : (
        <TableCard>
          <table className="rtable w-full">
            <caption className="sr-only">Depósitos del cliente</caption>
            <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Fecha</th><th className="th text-right">Monto</th><th className="th">Referencia</th><th className="th">Nota</th><th className="th text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((d) => (
                <tr key={d.id}>
                  <td data-label="Fecha" className="td">{dateOnly(d.depositedAt)}</td>
                  <td data-label="Monto" className="td text-right font-semibold tabular-nums">{money(d.amount, d.currency)}</td>
                  <td data-label="Referencia" className="td text-slate-600">{d.reference ?? '—'}</td>
                  <td data-label="Nota" className="td max-w-xs text-slate-600">{d.note ?? '—'}</td>
                  <td data-label="Acciones" className="td text-right">
                    <Button variant="ghost" className="px-2" aria-label={`Editar el depósito del ${dateOnly(d.depositedAt)}`} onClick={() => open(d)}><Pencil className="h-4 w-4" aria-hidden /></Button>
                    <Button variant="ghost" className="px-2 text-red-700" aria-label={`Eliminar el depósito del ${dateOnly(d.depositedAt)}`} onClick={() => setToDelete(d)}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      <Modal open={editing !== null} onClose={() => !busy && setEditing(null)} title={editing === 'new' ? 'Registrar depósito' : 'Editar depósito'}
        footer={<><Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancelar</Button><Button type="submit" form="deposit-form" loading={busy} disabled={!valid}>Guardar</Button></>}>
        <form id="deposit-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Monto (${data.currency})`}>{(fid) => <input id={fid} type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={set('amount')} required autoFocus />}</Field>
            <Field label="Fecha del depósito">{(fid) => <input id={fid} type="date" className="input" value={form.depositedAt} max={todayLocal()} onChange={set('depositedAt')} required />}</Field>
          </div>
          <Field label="Referencia bancaria (opcional)" hint="Número de comprobante o de transferencia, para conciliarlo con el movimiento real.">{(fid) => <input id={fid} className="input" value={form.reference} maxLength={80} onChange={set('reference')} />}</Field>
          <Field label="Nota (opcional)" hint={`${form.note.length}/300 · El cliente la ve`}>{(fid) => <textarea id={fid} className="input min-h-20" value={form.note} maxLength={300} onChange={set('note')} />}</Field>
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>}
        </form>
      </Modal>

      <ConfirmModal open={!!toDelete} danger title="Eliminar depósito" confirmLabel="Eliminar" loading={busy} onClose={() => setToDelete(null)} onConfirm={remove}
        message={<>Se eliminará el depósito de <strong>{toDelete ? money(toDelete.amount, toDelete.currency) : ''}</strong> y el total del cliente se recalculará. Queda registrado en la auditoría.</>} />
    </>
  );
}

export default function DepositsPage() {
  return <SuperOnly><Deposits /></SuperOnly>;
}
