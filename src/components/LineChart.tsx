'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { site } from '@/lib/site';
import { dateOnly } from '@/lib/format';
import { cn } from './ui';

export type ChartPoint = { x: string; y: number }; // x = "YYYY-MM-DD"
export type ChartSeries = { id: string; label: string; color: 1 | 2; points: ChartPoint[]; step?: boolean; area?: boolean };

const COLOR = {
  1: { stroke: 'stroke-series-1', fill: 'fill-series-1/10', dot: 'fill-series-1', key: 'bg-series-1' },
  2: { stroke: 'stroke-series-2', fill: 'fill-series-2/10', dot: 'fill-series-2', key: 'bg-series-2' },
} as const;

const time = (day: string) => new Date(`${day}T00:00:00Z`).getTime();
const DAY = 86_400_000;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || Math.abs(max) * 0.1 || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(Math.round(v / step) * step);
  return out;
}

const axisDay = (t: number, shortSpan: boolean) =>
  new Intl.DateTimeFormat(site.locale, shortSpan ? { day: '2-digit', month: 'short', timeZone: 'UTC' } : { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(t));

/** Valor de la serie en `day` (último punto con fecha <= day). */
function valueAt(points: ChartPoint[], day: string): number | null {
  let found: number | null = null;
  for (const p of points) {
    if (p.x <= day) found = p.y;
    else break;
  }
  return found;
}

/**
 * Gráfico de líneas accesible y responsivo: línea de 2px, área tenue, rejilla de 1px, punto final con anillo,
 * crosshair que sigue al puntero (mouse, táctil o flechas del teclado), tooltip con todas las series y tabla equivalente.
 */
export function LineChart({ series, format, axisFormat, ariaLabel, height }: {
  series: ChartSeries[];
  format: (n: number) => string;
  axisFormat?: (n: number) => string;
  ariaLabel: string;
  height?: number;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tickFormat = axisFormat ?? format;

  const xs = useMemo(() => [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort(), [series]);
  const h = height ?? (width && width < 480 ? 210 : 270);

  const geometry = useMemo(() => {
    const values = series.flatMap((s) => s.points.map((p) => p.y));
    if (xs.length < 2 || values.length === 0) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min || Math.abs(max) * 0.05 || 1) * 0.12;
    const lo = min - pad;
    const hi = max + pad;
    const yTicks = niceTicks(lo, hi, width < 480 ? 3 : 4).filter((v) => v >= lo && v <= hi);
    const widest = Math.max(...yTicks.map((v) => tickFormat(v).length), 4);
    const left = Math.min(Math.max(widest * 6.4 + 14, 40), 84);
    return { lo, hi, yTicks, left, right: 14, top: 12, bottom: 28, t0: time(xs[0]), t1: time(xs[xs.length - 1]) };
  }, [series, xs, tickFormat, width]);

  const moveTo = useCallback((clientX: number) => {
    if (!geometry || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const plotW = rect.width - geometry.left - geometry.right;
    const t = geometry.t0 + ((clientX - rect.left - geometry.left) / plotW) * (geometry.t1 - geometry.t0);
    let best = 0;
    let bestDist = Infinity;
    xs.forEach((x, i) => {
      const d = Math.abs(time(x) - t);
      if (d < bestDist) { best = i; bestDist = d; }
    });
    setActive(best);
  }, [geometry, xs]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (xs.length === 0) return;
    const cur = active ?? xs.length - 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(Math.max(0, cur - 1)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setActive(Math.min(xs.length - 1, cur + 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(xs.length - 1); }
    else if (e.key === 'Escape') setActive(null);
  };

  if (!geometry) {
    return <p className="py-10 text-center text-sm text-slate-500">Todavía no hay suficientes datos para graficar. Cuando haya más valoraciones verás aquí la evolución.</p>;
  }

  const { lo, hi, yTicks, left, right, top, bottom, t0, t1 } = geometry;
  const plotW = Math.max(width - left - right, 10);
  const plotH = h - top - bottom;
  const px = (t: number) => left + ((t - t0) / (t1 - t0 || 1)) * plotW;
  const py = (v: number) => top + (1 - (v - lo) / (hi - lo)) * plotH;
  const shortSpan = (t1 - t0) / DAY <= 150;
  const xTickCount = width < 480 ? 3 : 5;
  const xTicks = Array.from({ length: xTickCount }, (_, i) => t0 + ((t1 - t0) * i) / (xTickCount - 1));

  const pathFor = (s: ChartSeries) => {
    const pts = s.points;
    if (!pts.length) return '';
    let d = `M${px(time(pts[0].x)).toFixed(1)},${py(pts[0].y).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const x = px(time(pts[i].x)).toFixed(1);
      if (s.step) d += ` L${x},${py(pts[i - 1].y).toFixed(1)}`;
      d += ` L${x},${py(pts[i].y).toFixed(1)}`;
    }
    return d;
  };

  const activeX = active !== null ? xs[active] : null;
  const activePx = activeX ? px(time(activeX)) : null;
  const flip = activePx !== null && activePx > width * 0.55;
  const summary = `${ariaLabel}. Del ${dateOnly(xs[0])} al ${dateOnly(xs[xs.length - 1])}. ${series.map((s) => `${s.label}: de ${format(s.points[0].y)} a ${format(s.points[s.points.length - 1].y)}`).join('; ')}. Usa las flechas izquierda y derecha para recorrer los datos.`;

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
          {series.map((s) => (
            <li key={s.id} className="inline-flex items-center gap-2"><span className={cn('h-0.5 w-4 rounded', COLOR[s.color].key)} aria-hidden />{s.label}</li>
          ))}
        </ul>
      )}
      <div ref={wrapRef} className="relative select-none rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500"
        style={{ touchAction: 'pan-y' }} tabIndex={0} role="group" aria-label={summary} onKeyDown={onKeyDown} onFocus={() => setActive((a) => a ?? xs.length - 1)} onBlur={() => setActive(null)}>
        {width > 0 && (
          <svg ref={svgRef} width={width} height={h} viewBox={`0 0 ${width} ${h}`} aria-hidden
            onPointerMove={(e: PointerEvent) => moveTo(e.clientX)} onPointerDown={(e: PointerEvent) => moveTo(e.clientX)} onPointerLeave={() => setActive(null)}>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={left} x2={width - right} y1={py(v)} y2={py(v)} className="stroke-slate-200" strokeWidth={1} />
                <text x={left - 8} y={py(v)} textAnchor="end" dominantBaseline="middle" className="fill-slate-500 text-[11px] tabular-nums">{tickFormat(v)}</text>
              </g>
            ))}
            <line x1={left} x2={width - right} y1={top + plotH} y2={top + plotH} className="stroke-slate-300" strokeWidth={1} />
            {xTicks.map((t, i) => (
              <text key={i} x={px(t)} y={h - 8} textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'} className="fill-slate-500 text-[11px]">{axisDay(t, shortSpan)}</text>
            ))}
            {series.filter((s) => s.area).map((s) => (
              <path key={`a-${s.id}`} d={`${pathFor(s)} L${px(time(s.points[s.points.length - 1].x)).toFixed(1)},${top + plotH} L${px(time(s.points[0].x)).toFixed(1)},${top + plotH} Z`} className={COLOR[s.color].fill} />
            ))}
            {series.map((s) => (
              <path key={s.id} d={pathFor(s)} className={cn('fill-none', COLOR[s.color].stroke)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {activePx !== null && <line x1={activePx} x2={activePx} y1={top} y2={top + plotH} className="stroke-slate-400" strokeWidth={1} />}
            {series.map((s) => {
              const last = s.points[s.points.length - 1];
              const at = activeX ? valueAt(s.points, activeX) : null;
              const cx = activeX && at !== null ? activePx! : px(time(last.x));
              const cy = py(activeX && at !== null ? at : last.y);
              return <circle key={`d-${s.id}`} cx={cx} cy={cy} r={4} className={cn(COLOR[s.color].dot, 'stroke-surface')} strokeWidth={2} />;
            })}
          </svg>
        )}
        {activeX && activePx !== null && (
          <div className="pointer-events-none absolute top-2 z-10 w-48 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs shadow-lg"
            style={{ left: activePx, transform: `translateX(${flip ? 'calc(-100% - 12px)' : '12px'})` }}>
            <p className="text-slate-500">{dateOnly(activeX)}</p>
            {series.map((s) => {
              const v = valueAt(s.points, activeX);
              return v === null ? null : (
                <p key={s.id} className="mt-1 flex items-center gap-2">
                  <span className={cn('h-0.5 w-3 shrink-0 rounded', COLOR[s.color].key)} aria-hidden />
                  <span className="text-sm font-semibold tabular-nums text-slate-900">{format(v)}</span>
                  <span className="truncate text-slate-500">{s.label}</span>
                </p>
              );
            })}
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-slate-600 hover:text-slate-900">Ver datos en tabla</summary>
        <div className="mt-2 max-h-60 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{ariaLabel}</caption>
            <thead className="sticky top-0 bg-slate-50 text-slate-600"><tr><th className="px-3 py-2 font-semibold">Fecha</th>{series.map((s) => <th key={s.id} className="px-3 py-2 text-right font-semibold">{s.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {[...xs].reverse().map((x) => (
                <tr key={x}><td className="px-3 py-1.5 text-slate-600">{dateOnly(x)}</td>{series.map((s) => <td key={s.id} className="px-3 py-1.5 text-right tabular-nums">{valueAt(s.points, x) === null ? '—' : format(valueAt(s.points, x) as number)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
