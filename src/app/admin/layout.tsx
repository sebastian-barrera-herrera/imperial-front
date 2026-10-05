'use client';

import { Banknote, Bell, Briefcase, Download, FileCheck2, History, ImagePlus, KeyRound, Landmark, LayoutDashboard, PanelsTopLeft, UserCog, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Shell, type NavItem } from '@/components/Shell';
import { PageLoader } from '@/components/ui';
import { useRequireRole } from '@/lib/auth';
import { LiveProvider } from '@/lib/realtime';

const STAFF_NAV: NavItem[] = [
  { href: '/admin', label: 'Panel general', icon: LayoutDashboard, exact: true },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/documentos', label: 'Validar documentos', icon: FileCheck2 },
  { href: '/admin/desembolsos', label: 'Desembolsos', icon: Banknote },
  { href: '/admin/casos', label: 'Casos', icon: Briefcase },
  { href: '/admin/alertas', label: 'Alertas', icon: Bell, alerts: true },
  { href: '/admin/reportes', label: 'Reportes', icon: Download },
];
const ACCOUNT_NAV: NavItem[] = [{ href: '/admin/cuenta', label: 'Mi cuenta', icon: KeyRound }];
const SUPER_NAV: NavItem[] = [
  { href: '/admin/capital', label: 'Capital e inversión', icon: Landmark },
  { href: '/admin/contenido', label: 'Contenido del sitio', icon: PanelsTopLeft },
  { href: '/admin/imagenes', label: 'Editor de imágenes', icon: ImagePlus },
  { href: '/admin/usuarios', label: 'Usuarios y roles', icon: UserCog },
  { href: '/admin/auditoria', label: 'Auditoría', icon: History },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireRole(['SUPERADMIN', 'LAWYER']);
  if (loading || !user) return <PageLoader label="Verificando sesión…" />;
  const nav = user.role === 'SUPERADMIN' ? [...STAFF_NAV, ...SUPER_NAV, ...ACCOUNT_NAV] : [...STAFF_NAV, ...ACCOUNT_NAV];
  return (
    <LiveProvider>
      <Shell nav={nav} area={user.role === 'SUPERADMIN' ? 'Superadministrador' : 'Panel de abogados'} alertsHref="/admin/alertas">{children}</Shell>
    </LiveProvider>
  );
}
