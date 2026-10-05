'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { Role, User } from './types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string, acceptPrivacy: boolean) => Promise<User>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const homeFor = (role: Role) => (role === 'CLIENT' ? '/dashboard' : '/admin');

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setUser(await api.get<User>('/auth/me'));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Si la API responde 401 incluso tras renovar, la sesión terminó: limpiar y volver al login.
  useEffect(() => {
    const onUnauthorized = () => {
      void api.post('/auth/logout').catch(() => undefined);
      setUser(null);
      router.replace('/login');
    };
    window.addEventListener('ilg:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ilg:unauthorized', onUnauthorized);
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      reload,
      login: async (email, password) => {
        const u = await api.post<User>('/auth/login', { email, password });
        setUser(u);
        return u;
      },
      register: async (fullName, email, password, acceptPrivacy) => {
        const u = await api.post<User>('/auth/register', { fullName, email, password, acceptPrivacy });
        setUser(u);
        return u;
      },
      logout: async () => {
        await api.post('/auth/logout').catch(() => undefined);
        setUser(null);
        router.replace('/login');
      },
    }),
    [user, loading, reload, router],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

/** Protege un área: redirige al login si no hay sesión, o al inicio que le corresponde si el rol no alcanza. */
export function useRequireRole(allowed: Role[]) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const permitted = !!user && allowed.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!permitted) router.replace(homeFor(user.role));
  }, [loading, user, permitted, router, pathname]);

  return { user: permitted ? user : null, loading: loading || !permitted };
}

/** Solo permite redirecciones internas a las áreas protegidas (evita open redirect). */
export function safeNext(next: string | null, fallback: string): string {
  if (next && /^\/(dashboard|admin)(\/|$)/.test(next) && !next.startsWith('//')) return next;
  return fallback;
}
