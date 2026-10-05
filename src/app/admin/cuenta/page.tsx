'use client';

import { PasswordCard } from '@/components/PasswordCard';
import { Card, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/types';

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Mi cuenta" description="Datos de acceso y seguridad de tu usuario del equipo." />
      <div className="space-y-6">
        <Card className="p-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-slate-500">Nombre</dt><dd>{user?.fullName}</dd></div>
            <div><dt className="text-slate-500">Correo</dt><dd>{user?.email}</dd></div>
            <div><dt className="text-slate-500">Rol</dt><dd>{user ? ROLE_LABELS[user.role] : ''}</dd></div>
          </dl>
        </Card>
        <PasswordCard />
      </div>
    </>
  );
}
