'use client';

import { Banknote, Bell, Briefcase, CheckCheck, FileText, Landmark, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { qs, useFetch } from '@/lib/hooks';
import { useLive, useOnLive } from '@/lib/realtime';
import { NOTIFICATION_TYPE_LABELS, type AppNotification, type NotificationType, type Paged } from '@/lib/types';
import { useToast } from './toast';
import { Badge, Button, Card, EmptyState, ErrorBox, PageLoader, Pagination, Tabs, cn } from './ui';

const ICONS: Record<NotificationType, typeof Bell> = { DOCUMENT: FileText, DISBURSEMENT: Banknote, CASE: Briefcase, OPPORTUNITY: Landmark, SYSTEM: Bell };

export function NotificationsList() {
  const toast = useToast();
  const { refreshUnread } = useLive();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [type, setType] = useState<NotificationType | ''>('');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useFetch<Paged<AppNotification> & { unread: number }>(`/notifications${qs({ page, pageSize: 15, unread: tab === 'unread' ? 'true' : undefined, type })}`);

  useOnLive(() => void reload());

  async function act(fn: () => Promise<unknown>) {
    try {
      await fn();
      await Promise.all([reload(), refreshUnread()]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={[{ id: 'all', label: 'Todas' }, { id: 'unread', label: 'Sin leer', count: data?.unread }]} value={tab} onChange={(t) => { setTab(t); setPage(1); }} />
        <div className="flex gap-2">
          <select aria-label="Filtrar por tipo" className="input w-auto" value={type} onChange={(e) => { setType(e.target.value as NotificationType | ''); setPage(1); }}>
            <option value="">Todos los tipos</option>
            {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map((t) => <option key={t} value={t}>{NOTIFICATION_TYPE_LABELS[t]}</option>)}
          </select>
          <Button variant="outline" onClick={() => act(() => api.post('/notifications/read-all'))} disabled={!data?.unread}><CheckCheck className="h-4 w-4" /> Marcar todas</Button>
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <PageLoader /> : (
        <Card>
          {data && data.items.length === 0 ? (
            <EmptyState icon={<Bell className="h-10 w-10" />} title={tab === 'unread' ? 'No tienes alertas sin leer' : 'Aún no tienes alertas'}>
              Aquí aparecerán los cambios en tus documentos, solicitudes y casos.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data?.items.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <li key={n.id} className={cn('flex gap-3 px-4 py-4', !n.readAt && 'bg-gold-50/50')}>
                    <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', n.readAt ? 'bg-slate-100 text-slate-500' : 'bg-navy-100 text-navy-700')}><Icon className="h-4 w-4" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn('text-sm', n.readAt ? 'text-slate-700' : 'font-semibold text-slate-900')}>{n.title}</p>
                        <Badge>{NOTIFICATION_TYPE_LABELS[n.type]}</Badge>
                        {!n.readAt && <span role="img" className="h-2 w-2 rounded-full bg-accent" aria-label="Sin leer" />}
                      </div>
                      {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{dateTime(n.createdAt)}</span>
                        {n.link && /^\/(?!\/)/.test(n.link) && <Link href={n.link} onClick={() => !n.readAt && void act(() => api.post(`/notifications/${n.id}/read`))} className="font-medium text-navy-700 underline">Ver detalle</Link>}
                        {!n.readAt && <button className="underline" onClick={() => act(() => api.post(`/notifications/${n.id}/read`))}>Marcar como leída</button>}
                      </div>
                    </div>
                    <button aria-label="Eliminar alerta" className="self-start rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600" onClick={() => act(() => api.delete(`/notifications/${n.id}`))}><Trash2 className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
          )}
          {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
        </Card>
      )}
    </div>
  );
}
