'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, EmptyState } from './ui';

/** Las pantallas exclusivas del superadmin muestran este aviso a otros roles (la API igualmente responde 403). */
export function SuperOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'SUPERADMIN') return <Card><EmptyState title="Sección exclusiva del superadmin">Tu rol no tiene acceso a esta pantalla.</EmptyState></Card>;
  return <>{children}</>;
}
