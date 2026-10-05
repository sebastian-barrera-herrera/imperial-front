'use client';

import { Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Badge, Card, CaseStatusBadge, EmptyState, ErrorBox, PageHeader, PageLoader } from '@/components/ui';
import { money, date } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { CASE_STAGE_LABELS, STAGE_ORDER, type CaseItem } from '@/lib/types';

export default function CasesPage() {
  const { data, error, loading, reload } = useFetch<CaseItem[]>('/cases');
  useOnLive(() => void reload());

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Seguimiento de casos" description="Consulta la etapa actual, los documentos requeridos y los próximos pasos de cada caso." />
      {(data ?? []).length === 0 ? (
        <Card><EmptyState icon={<Briefcase className="h-10 w-10" />} title="Aún no tienes casos">Cuando tu abogado abra un caso, aparecerá aquí con su avance. Mientras tanto, completa tu perfil y sube tus documentos.</EmptyState></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data!.map((c) => (
            <Link key={c.id} href={`/dashboard/casos/${c.id}`} className="card block p-5 transition hover:border-navy-300 hover:shadow">
              <div className="flex items-start justify-between gap-2">
                <div><Badge tone="navy">{c.number}</Badge><h2 className="mt-2 text-lg font-semibold">{c.title}</h2></div>
                <CaseStatusBadge status={c.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">Etapa actual: <strong>{CASE_STAGE_LABELS[c.stage]}</strong></p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={c.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Avance del caso ${c.number}`}>
                <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.max(c.progress ?? 0, 4)}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Etapa {STAGE_ORDER.indexOf(c.stage) + 1} de {STAGE_ORDER.length}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div><dt>Abogado</dt><dd className="text-sm text-slate-800">{c.lawyer?.fullName ?? 'Por asignar'}</dd></div>
                <div><dt>Monto reclamado</dt><dd className="text-sm text-slate-800">{money(c.amountClaimed, c.currency)}</dd></div>
                <div><dt>Abierto el</dt><dd className="text-sm text-slate-800">{date(c.createdAt)}</dd></div>
              </dl>
              {c.nextSteps && <p className="mt-3 line-clamp-2 rounded-lg bg-gold-50 px-3 py-2 text-sm text-gold-900"><strong>Próximos pasos:</strong> {c.nextSteps}</p>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
