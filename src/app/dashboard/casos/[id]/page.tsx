'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StageStepper } from '@/components/StageStepper';
import { Badge, Card, CaseStatusBadge, DisbursementBadge, ErrorBox, PageLoader, RequirementBadge, Timeline } from '@/components/ui';
import { dateTime, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { CASE_STAGE_LABELS, type CaseItem } from '@/lib/types';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useFetch<CaseItem>(`/cases/${id}`);
  useOnLive(() => void reload());

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'Caso no encontrado'} />;

  const missing = (data.requirements ?? []).filter((r) => r.state === 'MISSING' || r.state === 'REJECTED').length;

  return (
    <>
      <Link href="/dashboard/casos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-800"><ArrowLeft className="h-4 w-4" /> Volver a casos</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><Badge tone="navy">{data.number}</Badge><h1 className="mt-2 text-2xl font-semibold">{data.title}</h1>{data.description && <p className="mt-1 max-w-3xl text-slate-600">{data.description}</p>}</div>
        <CaseStatusBadge status={data.status} />
      </div>

      <Card className="p-5"><h2 className="mb-4 text-lg font-semibold">Progreso del caso</h2><StageStepper stage={data.stage} />
        <p className="mt-4 text-sm text-slate-600">Etapa actual: <strong>{CASE_STAGE_LABELS[data.stage]}</strong></p></Card>

      {data.nextSteps && <Card className="mt-6 border-gold-300 bg-gold-50 p-5"><h2 className="text-lg font-semibold">Próximos pasos</h2><p className="mt-1 whitespace-pre-line text-sm text-gold-900">{data.nextSteps}</p></Card>}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Documentos requeridos</h2>
              {missing > 0 && <Link href="/dashboard/documentos" className="btn-gold px-3 py-1.5">Subir documentos ({missing})</Link>}</div>
            {(data.requirements ?? []).length === 0 ? <p className="text-sm text-slate-500">Por ahora no hay documentos requeridos para este caso.</p> : (
              <ul className="divide-y divide-slate-100">
                {data.requirements!.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5"><div><p className="text-sm font-medium">{r.label}</p><p className="text-xs text-slate-500">{r.categoryLabel}</p></div><RequirementBadge state={r.state} /></li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-lg font-semibold">Solicitudes de desembolso</h2>
            {(data.disbursements ?? []).length === 0 ? <p className="text-sm text-slate-500">Este caso no tiene solicitudes de desembolso.</p> : (
              <ul className="divide-y divide-slate-100">
                {data.disbursements!.map((d) => (
                  <li key={d.id}><Link href={`/dashboard/desembolsos/${d.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50"><div><p className="text-sm font-medium">{d.code}</p><p className="text-xs text-slate-500">{money(d.amount, data.currency)} · {dateTime(d.createdAt)}</p></div><DisbursementBadge status={d.status} /></Link></li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-lg font-semibold">Información del caso</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Abogado responsable</dt><dd>{data.lawyer?.fullName ?? 'Por asignar'}</dd></div>
              <div><dt className="text-slate-500">Monto reclamado</dt><dd>{money(data.amountClaimed, data.currency)}</dd></div>
              <div><dt className="text-slate-500">Apertura</dt><dd>{dateTime(data.createdAt)}</dd></div>
              <div><dt className="text-slate-500">Última actualización</dt><dd>{dateTime(data.updatedAt)}</dd></div>
            </dl>
          </Card>
        </div>

        <Card className="h-fit p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Línea de tiempo</h2>
          <Timeline items={(data.events ?? []).map((e) => ({ id: e.id, title: e.title, description: e.description, meta: e.actorName ?? undefined, at: dateTime(e.createdAt) }))} />
        </Card>
      </div>
    </>
  );
}
