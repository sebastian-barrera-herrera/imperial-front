'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { Badge, Card, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { qs } from '@/lib/hooks';

const REPORTS = [
  { file: 'disbursements', title: 'Desembolsos', text: 'Solicitudes con cliente, monto, estado y fechas.', superOnly: false },
  { file: 'documents', title: 'Documentos', text: 'Documentos cargados, estado de validación y revisor.', superOnly: false },
  { file: 'cases', title: 'Casos', text: 'Casos con etapa, estado, monto reclamado y abogado.', superOnly: false },
  { file: 'users', title: 'Usuarios', text: 'Cuentas, roles, estados y último acceso.', superOnly: true },
  { file: 'positions', title: 'Inversiones', text: 'Posiciones de los clientes: capital, unidades, valor actual y ganancia.', superOnly: true },
  { file: 'interests', title: 'Interés en capital', text: 'Solicitudes de participación en oportunidades.', superOnly: true },
  { file: 'audit', title: 'Auditoría', text: 'Registro de acciones sensibles del sistema.', superOnly: true },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const range = qs({ from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined, to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined });

  return (
    <>
      <PageHeader title="Reportes descargables" description="Exporta información en CSV (compatible con Excel). Cada descarga queda registrada en la auditoría." />
      <Card className="mb-6 p-5">
        <h2 className="text-base font-semibold">Rango de fechas (opcional)</h2>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="text-sm">Desde<input type="date" className="input mt-1" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="text-sm">Hasta<input type="date" className="input mt-1" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.filter((r) => !r.superOnly || user?.role === 'SUPERADMIN').map((r) => (
          <Card key={r.file} className="flex flex-col p-5">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{r.title}</h2>{r.superOnly && <Badge tone="navy">Superadmin</Badge>}</div>
            <p className="mt-1 flex-1 text-sm text-slate-600">{r.text}</p>
            <a className="btn-outline mt-4" href={`/api/admin/reports/${r.file}.csv${range}`}><Download className="h-4 w-4" /> Descargar CSV</a>
          </Card>
        ))}
      </div>
    </>
  );
}
