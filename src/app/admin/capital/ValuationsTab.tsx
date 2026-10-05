'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { OpportunityPerformance } from '@/components/OpportunityPerformance';
import { Delta } from '@/components/markets';
import { useToast } from '@/components/toast';
import { Button, Card, ConfirmModal, EmptyState, ErrorBox, Field, PageLoader, TableCard } from '@/components/ui';
import { api } from '@/lib/api';
import { dateOnly, unitMoney } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { Opportunity, Valuation } from '@/lib/types';

const localToday = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en la zona del usuario

export function ValuationsTab({ opportunities }: { opportunities: Opportunity[] }) {
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string>(opportunities[0]?.id ?? '');
  const vals = useFetch<Valuation[]>(selectedId ? `/admin/investments/opportunities/${selectedId}/valuations` : null);
  const [date, setDate] = useState(localToday());
  const [unitValue, setUnitValue] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Valuation | null>(null);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    if (!selectedId && opportunities[0]) setSelectedId(opportunities[0].id);
  }, [opportunities, selectedId]);

  if (opportunities.length === 0) return <Card><EmptyState title="Primero crea una oportunidad">Cada oportunidad nace con un valor unitario inicial de 100; desde aquí lo actualizas con el tiempo.</EmptyState></Card>;

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/admin/investments/opportunities/${selectedId}/valuations`, { date, unitValue: Number(unitValue), note: note.trim() || undefined });
      toast.success('Valoración guardada. Si es la más reciente, se avisó a quienes tienen posiciones abiertas.');
      setUnitValue(''); setNote('');
      await vals.reload();
      setChartKey((k) => k + 1);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.delete(`/admin/investments/opportunities/${selectedId}/valuations/${toDelete.id}`);
      toast.success('Valoración eliminada');
      setToDelete(null);
      await vals.reload();
      setChartKey((k) => k + 1);
    } catch (err) {
      toast.error((err as Error).message);
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  }

  const rows = vals.data ?? [];
  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <Field label="Oportunidad">{(id) => <select id={id} className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{opportunities.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>}</Field>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Registrar valor por unidad</h2>
            <p className="text-xs text-slate-500">Si ya existe una valoración en esa fecha se corrige. Los inversionistas reciben una alerta al registrar la más reciente.</p>
            <form onSubmit={save} className="mt-4 space-y-3">
              <Field label="Fecha">{(id) => <input id={id} type="date" required max={localToday()} className="input" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
              <Field label="Valor por unidad (USD)">{(id) => <input id={id} type="number" required min="0.0001" step="0.0001" className="input" value={unitValue} onChange={(e) => setUnitValue(e.target.value)} placeholder="Ej. 103.4500" />}</Field>
              <Field label="Nota (opcional)">{(id) => <input id={id} maxLength={200} className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. Cierre del trimestre" />}</Field>
              <Button type="submit" loading={busy} disabled={!date || !unitValue}>Guardar valoración</Button>
            </form>
          </Card>
          {vals.error && <ErrorBox message={vals.error} onRetry={vals.reload} />}
          {vals.loading && !vals.data ? <PageLoader /> : (
            <TableCard>
              <table className="rtable w-full">
                <caption className="sr-only">Historial de valoraciones</caption>
                <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Fecha</th><th className="th text-right">Valor</th><th className="th text-right">Variación</th><th className="th text-right">Acciones</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((v, i) => {
                    const previous = rows[i + 1];
                    return (
                      <tr key={v.id}>
                        <td data-label="Fecha" className="td">{dateOnly(v.date)}{v.note && <p className="text-xs text-slate-500">{v.note}</p>}</td>
                        <td data-label="Valor" className="td text-right font-medium tabular-nums">{unitMoney(v.unitValue)}</td>
                        <td data-label="Variación" className="td text-right">{previous ? <Delta value={(v.unitValue / previous.unitValue - 1) * 100} /> : <span className="text-xs text-slate-500">Inicial</span>}</td>
                        <td data-label="Acciones" className="td text-right">{previous ? <button className="btn-ghost px-2 text-red-600" aria-label={`Eliminar valoración del ${dateOnly(v.date)}`} onClick={() => setToDelete(v)}><Trash2 className="h-4 w-4" /></button> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableCard>
          )}
        </div>
        <Card className="h-fit p-5 lg:col-span-3"><OpportunityPerformance key={`${selectedId}-${chartKey}`} opportunityId={selectedId} /></Card>
      </div>
      <ConfirmModal open={!!toDelete} title="Eliminar valoración" danger confirmLabel="Eliminar" loading={busy} onConfirm={() => void remove()} onClose={() => setToDelete(null)}
        message={<>¿Eliminar la valoración del <strong>{toDelete ? dateOnly(toDelete.date) : ''}</strong> ({toDelete ? unitMoney(toDelete.unitValue) : ''})? Las inversiones ya registradas conservan su valor de compra.</>} />
    </div>
  );
}
