'use client';

import { Bell, LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/realtime';
import { Logo } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { ROLE_LABELS } from '@/lib/types';
import { site } from '@/lib/site';
import { cn } from './ui';

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; alerts?: boolean };

export function Shell({ nav, area, alertsHref, children }: { nav: NavItem[]; area: string; alertsHref: string; children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unread } = useLive();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

  const sidebar = (
    <nav aria-label="Navegación principal" className="flex h-full flex-col bg-night-900 text-night-100">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo variant="mark" tone="onDark" width={42} />
        <div className="min-w-0">
          <p className="text-[0.78rem] font-semibold uppercase leading-snug tracking-[0.16em] text-cream">{site.name}</p>
          <p className="text-[11px] uppercase tracking-wider text-cream/70">{area}</p>
        </div>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? 'page' : undefined}
                className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition', active ? 'bg-night-700 font-medium text-white' : 'text-night-200 hover:bg-night-800 hover:text-white')}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.alerts && unread > 0 && <span className="rounded-full bg-accent-strong px-2 py-0.5 text-xs font-semibold text-white" aria-label={`${unread} sin leer`}>{unread > 99 ? '99+' : unread}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-night-800 p-4">
        <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
        <p className="truncate text-xs text-night-300">{user ? ROLE_LABELS[user.role] : ''} · {user?.email}</p>
        <button onClick={() => void logout()} className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-night-200 hover:bg-night-800 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-72">
      <aside className="fixed inset-y-0 left-0 hidden w-72 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="anim-fade absolute inset-0 bg-night-950/60" onClick={() => setOpen(false)} />
          <aside className="anim-slide absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            {sidebar}
            <button onClick={() => setOpen(false)} className="absolute right-2 top-3 rounded-md p-1 text-night-200 hover:bg-night-800" aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
          </aside>
        </div>
      )}

      <header className="header-scroll sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-surface/90 px-4 py-3 backdrop-blur lg:px-8">
        <button onClick={() => setOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menú"><Menu className="h-5 w-5" /></button>
        <p className="hidden text-sm text-slate-500 lg:block">Hola, <span className="font-medium text-slate-800">{user?.fullName.split(' ')[0]}</span></p>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href={alertsHref} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100" aria-label={unread ? `Alertas: ${unread} sin leer` : 'Alertas'}>
            <Bell className="h-5 w-5" aria-hidden />
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
          </Link>
        </div>
      </header>

      <main key={pathname} className="anim-page mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
