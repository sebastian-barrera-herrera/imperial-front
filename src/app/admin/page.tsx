'use client';

import { Banknote, Briefcase, FileCheck2, Users } from 'lucide-react';
import Link from 'next/link';
import { HBars, MonthlyBars } from '@/components/charts';
import { Card, ErrorBox, PageHeader, PageLoader, StatTile } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { dateTime, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { CASE_STAGE_LABELS, DISBURSEMENT_STATUS_LABELS, STAGE_ORDER, auditLabel, type CaseStage, type DisbursementStatus, type InvestmentSummary } from '@/lib/types';
import { Delta } from '@/components/markets';

type Stats = {
  clients: number; pendingDocuments: number; pendingDisbursements: number; activeCases: number; pendingInterests: number | null;
  totalDisbursed: string; pipelineAmount: string;
  disbursementsByStatus: { status: DisbursementStatus; count: number }[]; casesByStage: { stage: CaseStage; count: number }[];
  monthly: { month: string; requested: number; requestedAmount: number; disbursedAmount: number }[];
  recentActivity: { id: string; actorEmail: string | null; action: string; entity: string; createdAt: string }[] | null;
  investments: InvestmentSummary | null;
};

export default function AdminHome() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useFetch<Stats>('/admin/stats');
  useOnLive(() => void reload());

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? 'No se pudieron cargar las estadísticas'} onRetry={reload} />;

  const statusRows = (Object.keys(DISBURSEMENT_STATUS_LABELS) as DisbursementStatus[]).map((s) => ({ label: DISBURSEMENT_STATUS_LABELS[s], value: data.disbursementsByStatus.find((x) => x.status === s)?.count ?? 0 }));
  const stageRows = STAGE_ORDER.map((s) => ({ label: CASE_STAGE_LABELS[s], value: data.casesByStage.find((x) => x.stage === s)?.count ?? 0 }));

  return (
    <>
      <PageHeader title="Panel general" description={user?.role === 'SUPERADMIN' ? 'Vista global de la operación del despacho.' : 'Resumen de tu trabajo pendiente.'} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/admin/documentos" className="block"><StatTile label="Documentos por validar" value={data.pendingDocuments} tone={data.pendingDocuments ? 'alert' : 'default'} /></Link>
        <Link href="/admin/desembolsos" className="block"><StatTile label="Desembolsos pendientes" value={data.pendingDisbursements} tone={data.pendingDisbursements ? 'alert' : 'default'} /></Link>
        <Link href="/admin/casos" className="block"><StatTile label="Casos activos" value={data.activeCases} /></Link>
        <Link href="/admin/clientes" className="block"><StatTile label="Clientes activos" value={data.clients} /></Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total desembolsado" value={money(data.totalDisbursed)} />
        <StatTile label="En trámite (pendiente, aprobado, en proceso)" value={money(data.pipelineAmount)} />
        {data.pendingInterests !== null && <Link href="/admin/capital" className="block"><StatTile label="Interesados en capital" value={data.pendingInterests} hint="Solicitudes sin atender" /></Link>}
      </div>

      {data.investments && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/capital" className="block"><StatTile label="Activos bajo gestión" value={money(data.investments.aum)} hint={`${data.investments.activePositions} posiciones activas`} /></Link>
          <StatTile label="Capital aportado" value={money(data.investments.invested)} />
          <StatTile label="Rendimiento de la cartera" value={<Delta value={data.investments.returnPct} className="text-lg min-[400px]:text-xl sm:text-2xl" />} hint={<Delta value={data.investments.pnl} kind="money" className="text-xs" />} />
          <StatTile label="Inversionistas activos" value={data.investments.investors} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2"><h2 className="mb-3 text-lg font-semibold">Solicitudes de los últimos 6 meses</h2><MonthlyBars data={data.monthly} /></Card>
        <Card className="p-5"><h2 className="mb-3 text-lg font-semibold">Desembolsos por estado</h2><HBars rows={statusRows} empty="Aún no hay solicitudes." /></Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5"><h2 className="mb-3 text-lg font-semibold">Casos por etapa</h2><HBars rows={stageRows} empty="Aún no hay casos." /></Card>
        {data.recentActivity && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Actividad reciente</h2><Link href="/admin/auditoria" className="text-sm font-medium text-navy-700 underline">Ver auditoría</Link></div>
            <ul className="divide-y divide-slate-100">
              {data.recentActivity.map((a) => <li key={a.id} className="py-2 text-sm"><span className="font-medium">{auditLabel(a.action)}</span> <span className="text-slate-500">· {a.actorEmail ?? 'sistema'}</span><p className="text-xs text-slate-500">{dateTime(a.createdAt)}</p></li>)}
            </ul>
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:hidden">
        <Link className="btn-outline" href="/admin/documentos"><FileCheck2 className="h-4 w-4" /> Validar documentos</Link>
        <Link className="btn-outline" href="/admin/desembolsos"><Banknote className="h-4 w-4" /> Desembolsos</Link>
        <Link className="btn-outline" href="/admin/casos"><Briefcase className="h-4 w-4" /> Casos</Link>
        <Link className="btn-outline" href="/admin/clientes"><Users className="h-4 w-4" /> Clientes</Link>
      </div>
    </>
  );
}
