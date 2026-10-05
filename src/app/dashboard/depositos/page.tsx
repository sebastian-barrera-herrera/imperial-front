'use client';

import { Wallet } from 'lucide-react';
import { Card, EmptyState, ErrorBox, PageHeader, PageLoader, StatTile, TableCard } from '@/components/ui';
import { dateOnly, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import type { DepositsView } from '@/lib/types';

export default function DepositsPage() {
  const { data, error, loading, reload } = useFetch<DepositsView>('/deposits');
  useOnLive(() => void reload());
  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'No se pudieron cargar tus depósitos'} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Mis depósitos" description="Los depósitos que el despacho ha registrado a tu nombre. Si algún dato no coincide con tu comprobante, comunícate con tu asesor." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatTile label="Valor depositado" value={money(data.total, data.currency)} hint={`${data.items.length} ${data.items.length === 1 ? 'depósito registrado' : 'depósitos registrados'}`} />
      </div>
      {data.items.length === 0 ? (
        <Card><EmptyState icon={<Wallet className="h-10 w-10" />} title="Aún no hay depósitos registrados">Cuando el despacho registre un depósito a tu nombre, lo verás aquí y recibirás una alerta.</EmptyState></Card>
      ) : (
        <TableCard>
          <table className="rtable w-full">
            <caption className="sr-only">Depósitos registrados</caption>
            <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Fecha</th><th className="th text-right">Monto</th><th className="th">Referencia</th><th className="th">Nota</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((d) => (
                <tr key={d.id}>
                  <td data-label="Fecha" className="td">{dateOnly(d.depositedAt)}</td>
                  <td data-label="Monto" className="td text-right font-semibold tabular-nums">{money(d.amount, d.currency)}</td>
                  <td data-label="Referencia" className="td text-slate-600">{d.reference ?? '—'}</td>
                  <td data-label="Nota" className="td text-slate-600">{d.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </>
  );
}
