'use client';

import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type Tone = 'success' | 'error' | 'info';
type ToastItem = { id: number; tone: Tone; message: string };
type ToastApi = { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

const STYLES: Record<Tone, string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-navy-200 bg-surface text-navy-900',
};
const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((tone: Tone, message: string) => {
    const id = nextId.current++;
    setItems((prev) => [...prev.slice(-3), { id, tone, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), tone === 'error' ? 7000 : 4500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {items.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${STYLES[t.tone]}`}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
