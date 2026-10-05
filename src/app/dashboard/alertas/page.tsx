'use client';

import Link from 'next/link';
import { NotificationsList } from '@/components/NotificationsList';
import { PageHeader } from '@/components/ui';

export default function AlertsPage() {
  return (
    <>
      <PageHeader title="Alertas y notificaciones" description="Historial de avisos sobre tus documentos, solicitudes, casos y nuevas oportunidades."
        actions={<Link href="/dashboard/configuracion" className="btn-outline">Personalizar alertas</Link>} />
      <NotificationsList />
    </>
  );
}
