'use client';

import { Banknote, Bell, Briefcase, FileText, Home, Landmark, LineChart, Settings, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Shell, type NavItem } from '@/components/Shell';
import { PageLoader } from '@/components/ui';
import { useRequireRole } from '@/lib/auth';
import { LiveProvider } from '@/lib/realtime';

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home, exact: true },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: UserRound },
  { href: '/dashboard/documentos', label: 'Mis Documentos', icon: FileText },
  { href: '/dashboard/desembolsos', label: 'Solicitudes de Desembolso', icon: Banknote },
  { href: '/dashboard/casos', label: 'Seguimiento de Casos', icon: Briefcase },
  { href: '/dashboard/alertas', label: 'Alertas y Notificaciones', icon: Bell, alerts: true },
  { href: '/dashboard/capital', label: 'Capital e Inversión', icon: Landmark },
  { href: '/dashboard/inversiones', label: 'Mi Portafolio', icon: LineChart },
  { href: '/dashboard/configuracion', label: 'Configuración de Cuenta', icon: Settings },
];

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireRole(['CLIENT']);
  if (loading || !user) return <PageLoader label="Verificando sesión…" />;
  return (
    <LiveProvider>
      <Shell nav={NAV} area="Área de clientes" alertsHref="/dashboard/alertas">{children}</Shell>
    </LiveProvider>
  );
}
