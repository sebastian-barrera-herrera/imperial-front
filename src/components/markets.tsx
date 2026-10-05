'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { signedMoney, signedPercent } from '@/lib/format';
import { cn } from './ui';

type Tone = 'up' | 'down' | 'flat';
const toneOf = (n: number | null | undefined): Tone => (n === null || n === undefined || Math.abs(n) < 0.005 ? 'flat' : n > 0 ? 'up' : 'down');

const TEXT: Record<Tone, string> = { up: 'text-green-700', down: 'text-red-700', flat: 'text-slate-500' };

/** Variación con signo, flecha y color. La dirección nunca depende solo del color: lleva signo explícito y flecha. */
export function Delta({ value, kind = 'percent', className, digits = 2 }: { value: number | null | undefined; kind?: 'percent' | 'money'; className?: string; digits?: number }) {
  if (value === null || value === undefined) return <span className={cn('text-slate-500', className)}>—</span>;
  const tone = toneOf(value);
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus;
  const text = kind === 'percent' ? signedPercent(value, digits) : signedMoney(value);
  return (
    <span className={cn('inline-flex items-center gap-0.5 whitespace-nowrap font-medium tabular-nums', TEXT[tone], className)}>
      {tone !== 'flat' && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      <span className="sr-only">{tone === 'up' ? 'Sube ' : tone === 'down' ? 'Baja ' : 'Sin cambio '}</span>
      {text}
    </span>
  );
}

/** Mini-gráfico de tendencia (decorativo: los valores están en el texto contiguo). Trazo neutro; el punto final lleva el color de la tendencia. */
export function Sparkline({ points, width = 96, height = 28, className }: { points: { date: string; unitValue: number }[]; width?: number; height?: number; className?: string }) {
  if (points.length < 2) return <span className={cn('inline-block text-xs text-slate-500', className)} aria-hidden>—</span>;
  const values = points.map((p) => p.unitValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 4;
  const x = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2);
  const y = (v: number) => (max === min ? height / 2 : pad + (1 - (v - min) / (max - min)) * (height - pad * 2));
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.unitValue).toFixed(1)}`).join(' ');
  const tone = toneOf(values[values.length - 1] - values[0]);
  const dot = tone === 'up' ? 'fill-green-700' : tone === 'down' ? 'fill-red-700' : 'fill-slate-500';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn('inline-block shrink-0 align-middle', className)} aria-hidden>
      <path d={d} className="fill-none stroke-slate-400" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(values[values.length - 1])} r={4} className={cn(dot, 'stroke-surface')} strokeWidth={2} />
    </svg>
  );
}

export type Range = '1M' | '3M' | '6M' | '1A' | 'TODO';
const RANGE_DAYS: Record<Exclude<Range, 'TODO'>, number> = { '1M': 30, '3M': 91, '6M': 182, '1A': 365 };
const RANGE_LABEL: Record<Range, string> = { '1M': '1M', '3M': '3M', '6M': '6M', '1A': '1A', TODO: 'Todo' };

/** Recorta una serie al rango elegido, siempre conservando al menos dos puntos para poder dibujar una línea. */
export function filterRange<T>(items: T[], range: Range, getDate: (item: T) => string): T[] {
  if (range === 'TODO' || items.length <= 2) return items;
  const last = getDate(items[items.length - 1]);
  const cutoff = new Date(new Date(`${last}T00:00:00Z`).getTime() - RANGE_DAYS[range] * 86_400_000).toISOString().slice(0, 10);
  const within = items.filter((i) => getDate(i) >= cutoff);
  if (within.length >= 2) return within;
  return items.slice(-2);
}

export function RangeTabs({ value, onChange, className }: { value: Range; onChange: (r: Range) => void; className?: string }) {
  return (
    <div role="group" aria-label="Rango de fechas" className={cn('inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5', className)}>
      {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
        <button key={r} type="button" aria-pressed={value === r} onClick={() => onChange(r)}
          className={cn('min-w-10 rounded-md px-3 py-1.5 text-xs font-semibold transition', value === r ? 'bg-surface text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
          {RANGE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}
