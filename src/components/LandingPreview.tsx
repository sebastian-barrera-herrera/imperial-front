'use client';

import { Delta } from './markets';
import { LineChart } from './LineChart';
import { money } from '@/lib/format';

// Serie inventada, solo para ilustrar cómo se ve el portafolio. No son datos reales.
const SAMPLE = [10000, 10120, 10260, 10190, 10420, 10610, 10540, 10790, 10980, 11120, 11060, 11340];
const DATES = ['2025-10-01', '2025-11-01', '2025-12-01', '2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01'];

export function LandingPreview() {
  const last = SAMPLE[SAMPLE.length - 1];
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valor del portafolio</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">{money(last)}</p>
          <p className="mt-1 text-sm"><Delta value={last - 10000} kind="money" /> <Delta value={((last - 10000) / 10000) * 100} className="ml-1" /></p>
        </div>
        <span className="rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold-800">Datos de ejemplo</span>
      </div>
      <div className="mt-3">
        <LineChart ariaLabel="Vista ilustrativa de la evolución de un portafolio (datos de ejemplo)" height={190} format={(n) => money(n)} axisFormat={(n) => `${Math.round(n / 1000)}k`}
          series={[
            { id: 'v', label: 'Valor del portafolio', color: 1, area: true, points: DATES.map((x, i) => ({ x, y: SAMPLE[i] })) },
            { id: 'c', label: 'Capital aportado', color: 2, step: true, points: DATES.map((x) => ({ x, y: 10000 })) },
          ]} />
      </div>
    </div>
  );
}
