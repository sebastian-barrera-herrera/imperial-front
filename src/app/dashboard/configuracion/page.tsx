'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { PasswordCard } from '@/components/PasswordCard';
import { Button, Card, ErrorBox, PageHeader, PageLoader, Toggle } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFetch } from '@/lib/hooks';
import type { NotificationPrefs } from '@/lib/types';

export default function SettingsPage() {
  const toast = useToast();
  const { user, logout } = useAuth();
  const prefs = useFetch<NotificationPrefs>('/notifications/preferences');
  const [saving, setSaving] = useState(false);

  async function update(patch: Partial<NotificationPrefs>) {
    if (!prefs.data) return;
    const previous = prefs.data;
    prefs.setData({ ...previous, ...patch });
    setSaving(true);
    try {
      prefs.setData(await api.put<NotificationPrefs>('/notifications/preferences', patch));
    } catch (e) {
      prefs.setData(previous);
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Configuración de cuenta" description="Administra tu seguridad y las alertas que quieres recibir." />
      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Cuenta</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Nombre</dt><dd>{user?.fullName}</dd></div><div><dt className="text-slate-500">Correo</dt><dd>{user?.email}</dd></div></dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Preferencias de alertas</h2>
          <p className="text-sm text-slate-600">Elige qué avisos quieres ver en tu centro de notificaciones. Los avisos del sistema siempre se entregan.</p>
          {prefs.error && <ErrorBox message={prefs.error} onRetry={prefs.reload} />}
          {prefs.loading && !prefs.data ? <PageLoader /> : prefs.data && (
            <div className="mt-2 divide-y divide-slate-100">
              <Toggle label="Documentos" description="Documentos validados, rechazados o requeridos." checked={prefs.data.documents} disabled={saving} onChange={(v) => update({ documents: v })} />
              <Toggle label="Solicitudes de desembolso" description="Cambios de estado de tus solicitudes." checked={prefs.data.disbursements} disabled={saving} onChange={(v) => update({ disbursements: v })} />
              <Toggle label="Casos" description="Nuevas etapas, novedades y próximos pasos." checked={prefs.data.cases} disabled={saving} onChange={(v) => update({ cases: v })} />
              <Toggle label="Nuevas oportunidades de capital" description="Cuando se publique una nueva oportunidad." checked={prefs.data.opportunities} disabled={saving} onChange={(v) => update({ opportunities: v })} />
              <Toggle label="Copia por correo electrónico" description="Aún no disponible: la plataforma por ahora solo envía alertas dentro de la aplicación." checked={prefs.data.email} disabled onChange={() => undefined} />
            </div>
          )}
        </Card>

        <PasswordCard />

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Privacidad</h2>
          <p className="text-sm text-slate-600">Consulta cómo tratamos tus datos y cómo ejercer tus derechos de acceso, rectificación, supresión u oposición.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/aviso-de-privacidad" className="btn-outline">Aviso de privacidad</Link>
            <Link href="/privacidad" className="btn-outline">Política de privacidad</Link>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Sesión</h2>
          <p className="text-sm text-slate-600">Cierra la sesión en este dispositivo.</p>
          <Button variant="outline" className="mt-3" onClick={() => void logout()}><LogOut className="h-4 w-4" /> Cerrar sesión</Button>
        </Card>
      </div>
    </>
  );
}
