'use client';

import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { Badge, Card, DisbursementBadge, PageHeader, PageLoader, StatTile, cn } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { dateTime, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { CASE_STAGE_LABELS, STAGE_ORDER, type AppNotification, type CaseItem, type Disbursement, type DocumentItem, type DocumentSummary, type Paged, type Profile } from '@/lib/types';

export default function DashboardHome() {
  const { user } = useAuth();
  const profile = useFetch<Profile>('/profile');
  const docs = useFetch<{ items: DocumentItem[]; summary: DocumentSummary[] }>('/documents');
  const disb = useFetch<Disbursement[]>('/disbursements');
  const cases = useFetch<CaseItem[]>('/cases');
  const alerts = useFetch<Paged<AppNotification> & { unread: number }>('/notifications?pageSize=5');

  useOnLive(() => {
    void docs.reload();
    void disb.reload();
    void cases.reload();
    void alerts.reload();
  });

  if (profile.loading || docs.loading || disb.loading || cases.loading) return <PageLoader />;

  const summary = docs.data?.summary ?? [];
  const validated = (c: string) => (summary.find((s) => s.category === c)?.validated ?? 0) > 0;
  const profileDone = !!(profile.data?.cedula && profile.data.phone && profile.data.hasBankAccount);
  const activeDisb = (disb.data ?? []).filter((d) => ['PENDING', 'APPROVED', 'IN_PROCESS'].includes(d.status));
  const activeCases = (cases.data ?? []).filter((c) => c.status !== 'CLOSED');
  const pendingDocs = summary.reduce((n, s) => n + s.pending, 0);
  const rejectedDocs = summary.reduce((n, s) => n + s.rejected, 0);

  const steps = [
    { done: profileDone, label: 'Completa tu perfil y datos bancarios', href: '/dashboard/perfil' },
    { done: validated('IDENTITY'), label: 'Sube y valida tu documento de identidad', href: '/dashboard/documentos' },
    { done: validated('BANKING'), label: 'Sube y valida tu soporte bancario', href: '/dashboard/documentos' },
    { done: (disb.data ?? []).length > 0, label: 'Crea tu primera solicitud de desembolso', href: '/dashboard/desembolsos' },
  ];
  const onboarding = steps.some((s) => !s.done);

  return (
    <>
      <PageHeader title={`Bienvenido, ${user?.fullName.split(' ')[0]}`} description="Este es el resumen de tu cuenta." />

      {onboarding && (
        <Card className="mb-6 p-5">
          <h2 className="text-lg font-semibold">Primeros pasos</h2>
          <p className="text-sm text-slate-600">Completa estos pasos para poder solicitar tu desembolso.</p>
          <ul className="mt-4 space-y-2">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                  {s.done ? <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden /> : <Circle className="h-5 w-5 text-slate-300" aria-hidden />}
                  <span className={cn(s.done && 'text-slate-500 line-through')}>{s.label}</span>
                  {!s.done && <ArrowRight className="ml-auto h-4 w-4 text-slate-500" aria-hidden />}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Documentos en revisión" value={pendingDocs} hint={rejectedDocs ? `${rejectedDocs} rechazado(s) por corregir` : undefined} tone={rejectedDocs ? 'alert' : 'default'} />
        <StatTile label="Solicitudes activas" value={activeDisb.length} />
        <StatTile label="Casos activos" value={activeCases.length} />
        <StatTile label="Alertas sin leer" value={alerts.data?.unread ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Mis casos</h2><Link href="/dashboard/casos" className="text-sm font-medium text-navy-700 underline">Ver todos</Link></div>
          {activeCases.length === 0 ? <p className="text-sm text-slate-500">Todavía no tienes casos abiertos. Tu abogado lo creará cuando revise tu información.</p> : (
            <ul className="space-y-4">
              {activeCases.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link href={`/dashboard/casos/${c.id}`} className="block rounded-lg border border-slate-200 p-3 hover:border-navy-300">
                    <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{c.title}</p><Badge tone="navy">{c.number}</Badge></div>
                    <p className="mt-1 text-xs text-slate-500">Etapa: {CASE_STAGE_LABELS[c.stage]}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={c.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del caso">
                      <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.max(c.progress ?? 0, 4)}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Etapa {STAGE_ORDER.indexOf(c.stage) + 1} de {STAGE_ORDER.length}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Últimas solicitudes</h2><Link href="/dashboard/desembolsos" className="text-sm font-medium text-navy-700 underline">Ver todas</Link></div>
          {(disb.data ?? []).length === 0 ? <p className="text-sm text-slate-500">Aún no has creado solicitudes de desembolso.</p> : (
            <ul className="divide-y divide-slate-100">
              {disb.data!.slice(0, 4).map((d) => (
                <li key={d.id}><Link href={`/dashboard/desembolsos/${d.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                  <div><p className="text-sm font-medium">{d.code}</p><p className="text-xs text-slate-500">{money(d.amount, d.currency)} · {dateTime(d.createdAt)}</p></div>
                  <DisbursementBadge status={d.status} />
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Alertas recientes</h2><Link href="/dashboard/alertas" className="text-sm font-medium text-navy-700 underline">Ver historial</Link></div>
        {(alerts.data?.items ?? []).length === 0 ? <p className="text-sm text-slate-500">No tienes alertas por ahora.</p> : (
          <ul className="divide-y divide-slate-100">
            {alerts.data!.items.map((n) => (
              <li key={n.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div><p className={cn('text-sm', !n.readAt && 'font-semibold')}>{n.title}</p>{n.body && <p className="text-xs text-slate-500">{n.body}</p>}</div>
                <span className="shrink-0 text-xs text-slate-500">{dateTime(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
