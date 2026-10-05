import { money } from '@/lib/format';

type Month = { month: string; requested: number; requestedAmount: number; disbursedAmount: number };

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const label = (key: string) => MONTHS[Number(key.split('-')[1]) - 1];

/** Barras agrupadas: monto solicitado vs. desembolsado por mes. Incluye tabla accesible equivalente. */
export function MonthlyBars({ data }: { data: Month[] }) {
  const w = 640, h = 220, left = 8, bottom = 28, top = 12;
  const max = Math.max(...data.flatMap((d) => [d.requestedAmount, d.disbursedAmount]), 1);
  const slot = (w - left * 2) / data.length;
  const bar = Math.min(26, slot / 2 - 6);
  const y = (v: number) => top + (1 - v / max) * (h - top - bottom);
  const empty = data.every((d) => d.requestedAmount === 0);

  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full" role="img" aria-label="Monto solicitado y desembolsado por mes, últimos seis meses">
        {[0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={left} x2={w - left} y1={y(max * t)} y2={y(max * t)} className="stroke-slate-100" />)}
        <line x1={left} x2={w - left} y1={h - bottom} y2={h - bottom} className="stroke-slate-300" />
        {data.map((d, i) => {
          const cx = left + slot * i + slot / 2;
          return (
            <g key={d.month}>
              <rect x={cx - bar - 2} width={bar} y={y(d.requestedAmount)} height={h - bottom - y(d.requestedAmount)} rx={3} className="fill-navy-600"><title>{`${label(d.month)}: solicitado ${money(d.requestedAmount)}`}</title></rect>
              <rect x={cx + 2} width={bar} y={y(d.disbursedAmount)} height={h - bottom - y(d.disbursedAmount)} rx={3} className="fill-gold-500"><title>{`${label(d.month)}: desembolsado ${money(d.disbursedAmount)}`}</title></rect>
              <text x={cx} y={h - 10} textAnchor="middle" className="fill-slate-500 text-[11px]">{label(d.month)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-navy-600" /> Solicitado</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold-500" /> Desembolsado</span>
        {empty && <span className="text-slate-500">Aún no hay solicitudes en este periodo.</span>}
      </figcaption>
      <table className="sr-only"><caption>Montos por mes</caption><thead><tr><th>Mes</th><th>Solicitado</th><th>Desembolsado</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.month}><td>{d.month}</td><td>{money(d.requestedAmount)}</td><td>{money(d.disbursedAmount)}</td></tr>)}</tbody></table>
    </figure>
  );
}

/** Barras horizontales con etiqueta y valor; el valor siempre se muestra como texto. */
export function HBars({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (rows.every((r) => r.value === 0)) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between"><span className="text-slate-700">{r.label}</span><span className="font-medium tabular-nums">{r.value}</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-navy-600" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
