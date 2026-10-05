'use client';

import { useState } from 'react';
import { dateOnly, percent, unitMoney } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { Performance } from '@/lib/types';
import { LineChart } from './LineChart';
import { Delta, RangeTabs, filterRange, type Range } from './markets';
import { ErrorBox, PageLoader } from './ui';

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

/** Ficha de rendimiento tipo cotización: valor por unidad, variaciones por periodo, máximo/mínimo y evolución. */
export function OpportunityPerformance({ opportunityId }: { opportunityId: string }) {
  const { data, error, loading } = useFetch<Performance>(`/investments/opportunities/${opportunityId}/performance`);
  const [range, setRange] = useState<Range>('TODO');

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'No se pudo cargar el rendimiento'} />;
  const { stats } = data;
  const points = filterRange(data.series, range, (p) => p.date);

  return (
    <div className="space-y-4">
      {stats && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valor por unidad</p>
              <p className="text-4xl font-semibold tracking-tight text-slate-900">{unitMoney(stats.latestValue)}</p>
              <p className="mt-1 text-sm text-slate-500">
                {stats.changePct !== null ? <><Delta value={stats.changePct} /> <span>vs. la valoración anterior · </span></> : null}al {dateOnly(stats.latestDate)}
              </p>
            </div>
            <RangeTabs value={range} onChange={setRange} />
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="1 mes"><Delta value={stats.oneMonthPct} /></Stat>
            <Stat label="3 meses"><Delta value={stats.threeMonthPct} /></Stat>
            <Stat label="En el año"><Delta value={stats.ytdPct} /></Stat>
            <Stat label="Desde el inicio"><Delta value={stats.sinceInceptionPct} /></Stat>
            <Stat label="Máximo">{unitMoney(stats.high)}</Stat>
            <Stat label="Mínimo">{unitMoney(stats.low)}</Stat>
            <Stat label="Valor inicial">{unitMoney(stats.inceptionValue)}</Stat>
            <Stat label="Inicio">{dateOnly(stats.inceptionDate)}</Stat>
          </dl>
        </>
      )}
      <LineChart ariaLabel={`Valor por unidad de ${data.title}`} format={(n) => unitMoney(n)} axisFormat={(n) => n.toFixed(n >= 100 ? 0 : 2)}
        series={[{ id: 'unit', label: 'Valor por unidad', color: 1, area: true, points: points.map((p) => ({ x: p.date, y: p.unitValue })) }]} />
      <p className="text-xs text-slate-500">Rendimientos pasados no garantizan resultados futuros. Variación total desde el inicio: {stats?.sinceInceptionPct !== null && stats?.sinceInceptionPct !== undefined ? percent(stats.sinceInceptionPct) : '—'}.</p>
    </div>
  );
}
