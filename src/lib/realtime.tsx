'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '@/components/toast';
import { api } from './api';
import { useAuth } from './auth';
import type { AppNotification } from './types';

type LiveEvent = { type: 'notification'; data: AppNotification } | { type: 'refresh' };
type Listener = (event: LiveEvent) => void;

type LiveContextValue = {
  unread: number;
  refreshUnread: () => Promise<void>;
  subscribe: (listener: Listener) => () => void;
};

const LiveContext = createContext<LiveContextValue | null>(null);

/**
 * Mantiene abierto el canal SSE del usuario: actualiza el contador de alertas, muestra avisos
 * y permite a cada página recargar sus datos cuando algo cambia en el servidor.
 */
export function LiveProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [unread, setUnread] = useState(0);
  const listeners = useRef(new Set<Listener>());

  const refreshUnread = useCallback(async () => {
    try {
      setUnread((await api.get<{ unread: number }>('/notifications/unread-count')).unread);
    } catch {
      /* el contador es informativo */
    }
  }, []);

  const emit = useCallback((event: LiveEvent) => listeners.current.forEach((l) => l(event)), []);

  useEffect(() => {
    if (!user) return;
    let source: EventSource | null = null;
    let closed = false;
    let retry = 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const open = () => {
      source = new EventSource('/api/notifications/stream');
      source.addEventListener('notification', (e) => {
        retry = 1000;
        const data = JSON.parse((e as MessageEvent).data) as AppNotification;
        setUnread((n) => n + 1);
        toastRef.current.info(data.title);
        emit({ type: 'notification', data });
      });
      source.addEventListener('refresh', () => {
        void refreshUnread();
        emit({ type: 'refresh' });
      });
      source.onerror = () => {
        source?.close();
        if (closed) return;
        // Posible token vencido: /auth/me lo renueva antes de reconectar.
        timer = setTimeout(async () => {
          await api.get('/auth/me').catch(() => undefined);
          if (!closed) open();
        }, retry);
        retry = Math.min(retry * 2, 30_000);
      };
    };

    void refreshUnread();
    open();
    return () => {
      closed = true;
      source?.close();
      clearTimeout(timer);
    };
  }, [user, emit, refreshUnread]);

  const value = useMemo<LiveContextValue>(
    () => ({
      unread,
      refreshUnread,
      subscribe: (listener) => {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
      },
    }),
    [unread, refreshUnread],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error('useLive debe usarse dentro de LiveProvider');
  return ctx;
}

/** Ejecuta `callback` cada vez que llega un evento en tiempo real (p. ej. para recargar una lista). */
export function useOnLive(callback: (event: LiveEvent) => void) {
  const { subscribe } = useLive();
  const ref = useRef(callback);
  ref.current = callback;
  useEffect(() => subscribe((e) => ref.current(e)), [subscribe]);
}
