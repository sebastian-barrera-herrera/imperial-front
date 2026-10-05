'use client';

import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import {
  CASE_STATUS_LABELS, DISBURSEMENT_STATUS_LABELS, DOC_STATUS_LABELS, REQUIREMENT_STATE_LABELS,
  type CaseStatus, type DisbursementStatus, type DocumentStatus, type Requirement,
} from '@/lib/types';

import { cn } from '@/lib/cn';
export { cn };

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} aria-hidden />;
}

export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Spinner /> {label}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'gold' | 'outline' | 'danger' | 'ghost'; loading?: boolean };
export function Button({ variant = 'primary', loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={cn(`btn-${variant}`, className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string | null; hint?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children(id)}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('card', className)}>{children}</section>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{message}</span>
      {onRetry && <button className="font-medium underline" onClick={onRetry}>Reintentar</button>}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="font-medium text-slate-700">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatTile({ label, value, hint, tone = 'default' }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'default' | 'alert' }) {
  return (
    <div className={cn('card p-4', tone === 'alert' && 'border-gold-300 bg-gold-50')}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900 min-[400px]:text-xl sm:text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  navy: 'bg-navy-100 text-navy-800',
} as const;
type Tone = keyof typeof TONES;

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone])}>{children}</span>;
}

const DOC_TONE: Record<DocumentStatus, Tone> = { PENDING: 'amber', VALIDATED: 'green', REJECTED: 'red' };
export const DocStatusBadge = ({ status }: { status: DocumentStatus }) => <Badge tone={DOC_TONE[status]}>{DOC_STATUS_LABELS[status]}</Badge>;

const DISB_TONE: Record<DisbursementStatus, Tone> = { PENDING: 'amber', APPROVED: 'blue', IN_PROCESS: 'navy', DISBURSED: 'green', REJECTED: 'red', CANCELLED: 'slate' };
export const DisbursementBadge = ({ status }: { status: DisbursementStatus }) => <Badge tone={DISB_TONE[status]}>{DISBURSEMENT_STATUS_LABELS[status]}</Badge>;

const CASE_TONE: Record<CaseStatus, Tone> = { OPEN: 'blue', IN_PROGRESS: 'navy', WAITING_CLIENT: 'amber', CLOSED: 'slate' };
export const CaseStatusBadge = ({ status }: { status: CaseStatus }) => <Badge tone={CASE_TONE[status]}>{CASE_STATUS_LABELS[status]}</Badge>;

const REQ_TONE: Record<Requirement['state'], Tone> = { VALIDATED: 'green', PENDING: 'amber', REJECTED: 'red', MISSING: 'slate' };
export const RequirementBadge = ({ state }: { state: Requirement['state'] }) => <Badge tone={REQ_TONE[state]}>{REQUIREMENT_STATE_LABELS[state]}</Badge>;

export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg' | 'xl' }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const focusable = ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn('flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-slate-200 bg-surface shadow-xl focus:outline-none sm:rounded-2xl', width)}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Confirmar', danger, loading, onConfirm, onClose }: { open: boolean; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; loading?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
    </>}>
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>{total} resultados · página {page} de {pages}</span>
      <div className="flex gap-1">
        <button className="btn-outline px-2" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
        <button className="btn-outline px-2" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn('whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition', value === t.id ? 'border-gold-500 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-800')}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </label>
      <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50', checked ? 'bg-brand' : 'bg-slate-300')}>
        <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
      </button>
    </div>
  );
}

export function Timeline({ items }: { items: { id: string; title: string; description?: string | null; meta?: string; at: string; tone?: 'current' | 'done' }[] }) {
  return (
    <ol className="relative ml-2 border-l border-slate-200">
      {items.map((item, i) => (
        <li key={item.id} className="mb-5 ml-5 last:mb-0">
          <span className={cn('absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full border-2 border-surface', i === items.length - 1 ? 'bg-gold-500' : 'bg-navy-300')} />
          <p className="text-sm font-medium text-slate-900">{item.title}</p>
          {item.description && <p className="mt-0.5 text-sm text-slate-600">{item.description}</p>}
          <p className="mt-0.5 text-xs text-slate-500">{item.meta ? `${item.meta} · ` : ''}{item.at}</p>
        </li>
      ))}
    </ol>
  );
}

/** Tarjeta para tablas anchas. Si la tabla se desplaza horizontalmente, la región recibe foco de teclado (WCAG 2.1.1). */
export function TableCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });

  return (
    <Card className="overflow-hidden">
      <div ref={ref} className="overflow-x-auto" {...(scrollable ? { tabIndex: 0, role: 'region', 'aria-label': 'Tabla con desplazamiento horizontal' } : {})}>{children}</div>
    </Card>
  );
}
