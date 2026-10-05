'use client';

import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ClientPicker } from '@/components/ClientPicker';
import { NotificationsList } from '@/components/NotificationsList';
import { useToast } from '@/components/toast';
import { Button, Card, Field, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { NOTIFICATION_TYPE_LABELS, type NotificationType } from '@/lib/types';

export default function AdminAlertsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [audience, setAudience] = useState<'USER' | 'ALL_CLIENTS'>('USER');
  const [client, setClient] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [type, setType] = useState<NotificationType>('SYSTEM');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const linkInvalid = link !== '' && !/^\/(dashboard|admin)(\/|$)/.test(link);
  const canSend = title.trim().length >= 3 && !linkInvalid && (audience === 'ALL_CLIENTS' || !!client);

  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post<{ sent: number }>('/admin/notifications', {
        audience, userId: audience === 'USER' ? client?.id : undefined, type, title: title.trim(), body: body.trim() || undefined, link: link || undefined,
      });
      toast.success(res.sent ? `Alerta enviada a ${res.sent} ${res.sent === 1 ? 'cliente' : 'clientes'}` : 'Nadie recibió la alerta: los destinatarios silenciaron este tipo de aviso');
      setTitle(''); setBody(''); setLink('');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Alertas" description="Envía avisos a los clientes y consulta tu propio centro de notificaciones." />
      <Card className="mb-8 p-5">
        <h2 className="text-lg font-semibold">Enviar alerta manual</h2>
        <form onSubmit={send} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Destinatario">{(id) => (
            <select id={id} className="input" value={audience} onChange={(e) => setAudience(e.target.value as 'USER' | 'ALL_CLIENTS')}>
              <option value="USER">Un cliente</option>
              {user?.role === 'SUPERADMIN' && <option value="ALL_CLIENTS">Todos los clientes activos</option>}
            </select>)}</Field>
          <Field label="Tipo">{(id) => <select id={id} className="input" value={type} onChange={(e) => setType(e.target.value as NotificationType)}>{Object.entries(NOTIFICATION_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
          {audience === 'USER' && <div className="sm:col-span-2"><span className="mb-1 block text-sm font-medium text-slate-700">Cliente</span><ClientPicker value={client} onChange={setClient} /></div>}
          <Field label="Título" className="sm:col-span-2">{(id) => <input id={id} required minLength={3} maxLength={120} className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Falta tu certificación bancaria" />}</Field>
          <Field label="Mensaje (opcional)" className="sm:col-span-2">{(id) => <textarea id={id} rows={2} maxLength={1000} className="input" value={body} onChange={(e) => setBody(e.target.value)} />}</Field>
          <Field label="Enlace interno (opcional)" error={linkInvalid ? 'Debe empezar por /dashboard o /admin' : null} hint="Ej. /dashboard/documentos" className="sm:col-span-2">{(id) => <input id={id} maxLength={200} className="input" value={link} onChange={(e) => setLink(e.target.value)} />}</Field>
          <div className="sm:col-span-2"><Button type="submit" loading={busy} disabled={!canSend}><Send className="h-4 w-4" /> Enviar alerta</Button></div>
        </form>
      </Card>
      <h2 className="mb-3 text-lg font-semibold">Mis notificaciones</h2>
      <NotificationsList />
    </>
  );
}
