import { site } from './site';

const LOCALE = site.locale;

export function money(value: string | number | null | undefined, currency: string = site.currency): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency, minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
}

/** Valores unitarios (valor por unidad de un fondo) llevan siempre 2–4 decimales. */
export function unitMoney(value: string | number | null | undefined, currency: string = site.currency): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);
}

export function date(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

/** Fechas sin hora (YYYY-MM-DD o medianoche UTC): se formatean en UTC para que no se corran un día según la zona horaria. */
export function dateOnly(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

export function dateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function percent(n: number, digits = 2): string {
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits }).format(n)}%`;
}

/** Variación con signo explícito: +1.25% / −0.40% (el signo, no solo el color, comunica la dirección). */
export function signedPercent(n: number, digits = 2): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Math.abs(n))}%`;
}

export function signedMoney(n: number, currency: string = site.currency): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${money(Math.abs(n), currency)}`;
}
