'use client';

import { LineChart as LineChartIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LineChart } from '@/components/LineChart';
import { OpportunityPerformance } from '@/components/OpportunityPerformance';
import { Delta, RangeTabs, Sparkline, filterRange, type Range } from '@/components/markets';
import { Badge, Card, EmptyState, ErrorBox, Modal, PageHeader, PageLoader, StatTile, TableCard } from '@/components/ui';
import { dateOnly, money, percent, unitMoney } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import type { Portfolio } from '@/lib/types';

export default function PortfolioPage() {
  const { data, error, loading, reload } = useFetch<Portfolio>('/investments/portfolio');
  const [range, setRange] = useState<Range>('TODO');
  const [detail, setDetail] = useState<{ id: string; title: string } | null>(null);
  useOnLive(() => void reload());

  const history = useMemo(() => filterRange(data?.history ?? [], range, (h) => h.date), [data, range]);

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'No se pudo cargar tu portafolio'} onRetry={reload} />;

  const { summary, allocation, positions } = data;
  const cur = data.currency;

  return (
    <>
      <PageHeader title="Mi portafolio" description="Valor actual de tus inversiones, su rendimiento y cómo ha evolucionado. Son cifras informativas: el valor oficial lo confirma el despacho."
        actions={<Link href="/dashboard/capital" className="btn-outline">Ver oportunidades</Link>} />

      {positions.length === 0 ? (
        <Card>
          <EmptyState icon={<LineChartIcon className="h-10 w-10" />} title="Aún no tienes inversiones registradas">
            Cuando el despacho registre tu participación en una oportunidad, aquí verás su valor, rendimiento y evolución. Puedes conocer las oportunidades abiertas y solicitar participar.
            <div className="mt-4"><Link href="/dashboard/capital" className="btn-primary">Explorar oportunidades</Link></div>
          </EmptyState>
        </Card>
      ) : (
        <>
          <Card className="p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valor del portafolio</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{money(summary.currentValue, cur)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-2 whitespace-nowrap"><Delta value={summary.unrealizedPnl} kind="money" /><Delta value={summary.returnPct} /></span>
              <span className="text-slate-500">sobre {money(summary.invested, cur)} invertidos</span>
            </div>
            {summary.lastChange && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                Último cambio de valoración
                <span className="inline-flex items-center gap-2 whitespace-nowrap"><Delta value={summary.lastChange.amount} kind="money" /><Delta value={summary.lastChange.pct} /></span>
                <span>al {dateOnly(summary.lastChange.asOf)}</span>
              </p>
            )}
          </Card>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile label="Capital invertido" value={money(summary.invested, cur)} hint={`${summary.activePositions} ${summary.activePositions === 1 ? 'posición activa' : 'posiciones activas'}`} />
            <StatTile label="Ganancia no realizada" value={<Delta value={summary.unrealizedPnl} kind="money" className="text-lg min-[400px]:text-xl sm:text-2xl" />} hint="Valor actual menos capital" />
            <StatTile label="Rendimiento anualizado" value={summary.annualizedPct === null ? '—' : <Delta value={summary.annualizedPct} className="text-lg min-[400px]:text-xl sm:text-2xl" />} hint={summary.annualizedPct === null ? 'Disponible con 30+ días de tenencia' : 'Estimado, ponderado por capital'} />
            <StatTile label="Ganancia realizada" value={<Delta value={summary.realizedPnl} kind="money" className="text-lg min-[400px]:text-xl sm:text-2xl" />} hint="De inversiones ya rescatadas" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Evolución del portafolio</h2>
                <p className="text-xs text-slate-500">Valor de mercado de las posiciones abiertas frente al capital aportado.</p>
              </div>
              <RangeTabs value={range} onChange={setRange} />
            </div>
            <LineChart ariaLabel="Evolución del valor del portafolio y del capital aportado" format={(n) => money(n, cur)}
              axisFormat={(n) => (Math.abs(n) >= 1000 ? `${new Intl.NumberFormat('es-US', { maximumFractionDigits: 1 }).format(n / 1000)}k` : String(Math.round(n)))}
              series={[
                { id: 'value', label: 'Valor del portafolio', color: 1, area: true, points: history.map((h) => ({ x: h.date, y: h.value })) },
                { id: 'invested', label: 'Capital aportado', color: 2, step: true, points: history.map((h) => ({ x: h.date, y: h.invested })) },
              ]} />
          </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold">Distribución</h2>
              <p className="text-xs text-slate-500">Por oportunidad, según el valor actual.</p>
              {allocation.length === 0 ? <p className="mt-4 text-sm text-slate-500">No hay posiciones activas.</p> : (
                <ul className="mt-4 space-y-3">
                  {allocation.map((a) => (
                    <li key={a.opportunityId}>
                      <div className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate text-slate-700">{a.title}</span><span className="shrink-0 font-semibold tabular-nums">{percent(a.sharePct, 1)}</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${a.title}: ${percent(a.sharePct, 1)} del portafolio`}><div className="h-full rounded-full bg-series-1" style={{ width: `${Math.max(a.sharePct, 2)}%` }} /></div>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums">{money(a.value, cur)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-6">
              <TableCard>
                <table className="rtable w-full">
                  <caption className="sr-only">Posiciones</caption>
                  <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Posición</th><th className="th text-right">Invertido</th><th className="th text-right">Valor unitario</th><th className="th text-right">Valor actual</th><th className="th text-right">Ganancia</th><th className="th">Tendencia</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {positions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td data-label="Posición" className="td">
                          <button className="text-left" onClick={() => setDetail({ id: p.opportunity.id, title: p.opportunity.title })}>
                            <span className="font-medium text-navy-700 underline underline-offset-2">{p.opportunity.title}</span>
                          </button>
                          <p className="text-xs text-slate-500">{p.code} · {dateOnly(p.investedAt)} {p.status === 'REDEEMED' && <Badge>Rescatada</Badge>}</p>
                        </td>
                        <td data-label="Invertido" className="td text-right tabular-nums">{money(p.amount, cur)}<p className="text-xs text-slate-500">{p.units.toLocaleString('es-US', { maximumFractionDigits: 4 })} unid.</p></td>
                        <td data-label="Valor unitario" className="td text-right tabular-nums">{unitMoney(p.currentUnitValue, cur)}<p className="text-xs text-slate-500">costo {unitMoney(p.unitCost, cur)}</p></td>
                        <td data-label="Valor actual" className="td text-right font-semibold tabular-nums">{money(p.currentValue, cur)}</td>
                        <td data-label="Ganancia" className="td text-right"><Delta value={p.pnl} kind="money" /><br /><Delta value={p.returnPct} className="text-xs" />{p.annualizedPct !== null && <p className="text-xs text-slate-500">{percent(p.annualizedPct)} anual</p>}</td>
                        <td data-label="Tendencia" className="td"><Sparkline points={p.sparkline} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
          </div>

          <p className="mt-6 text-xs text-slate-500">Cifras al {dateOnly(data.asOf)}. El valor por unidad lo actualiza el despacho al valorar cada oportunidad; el rendimiento anualizado es una estimación y los rendimientos pasados no garantizan resultados futuros. Toda inversión implica riesgo de pérdida de capital.</p>
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ''} size="lg">
        {detail && <OpportunityPerformance opportunityId={detail.id} />}
      </Modal>
    </>
  );
}
