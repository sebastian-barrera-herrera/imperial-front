'use client';

import { Copy, KeyRound, Pencil, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SuperOnly } from '@/components/SuperOnly';
import { useToast } from '@/components/toast';
import { Badge, Button, ConfirmModal, EmptyState, ErrorBox, Field, Modal, PageHeader, PageLoader, Pagination, TableCard } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dateTime } from '@/lib/format';
import { qs, useDebounced, useFetch } from '@/lib/hooks';
import { ROLE_LABELS, type Paged, type Role } from '@/lib/types';

type Row = { id: string; email: string; fullName: string; role: Role; status: 'ACTIVE' | 'SUSPENDED'; lastLoginAt: string | null; createdAt: string };
type Credentials = { name: string; email: string; password: string };

function Users() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const { data, error, loading, reload } = useFetch<Paged<Row>>(`/admin/users${qs({ search: debounced, role, page, pageSize: 15 })}`);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('LAWYER');
  const [editing, setEditing] = useState<Row | null>(null);
  const [editRole, setEditRole] = useState<Role>('CLIENT');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [resetting, setResetting] = useState<Row | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await api.post<{ user: Row; temporaryPassword: string }>('/admin/users', { fullName: newName.trim(), email: newEmail.trim(), role: newRole });
      setCredentials({ name: res.user.fullName, email: res.user.email, password: res.temporaryPassword });
      setCreating(false); setNewName(''); setNewEmail('');
      await reload();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      await api.patch(`/admin/users/${editing.id}`, { role: editRole, status: editStatus });
      toast.success('Usuario actualizado');
      setEditing(null);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!resetting) return;
    setBusy(true);
    try {
      const res = await api.post<{ temporaryPassword: string }>(`/admin/users/${resetting.id}/reset-password`);
      setCredentials({ name: resetting.fullName, email: resetting.email, password: res.temporaryPassword });
      setResetting(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Usuarios y roles" description="Crea cuentas del equipo, cambia roles y suspende accesos. Cada cambio queda auditado."
        actions={<Button onClick={() => { setCreating(true); setFormError(null); }}><Plus className="h-4 w-4" /> Nuevo usuario</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Buscar nombre o correo…" aria-label="Buscar usuarios" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select aria-label="Rol" className="input w-auto" value={role} onChange={(e) => { setRole(e.target.value as Role | ''); setPage(1); }}><option value="">Todos los roles</option>{Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <PageLoader /> : (
        <TableCard>
          {data?.items.length === 0 ? <EmptyState title="Sin resultados" /> : (
            <table className="rtable w-full">
              <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Usuario</th><th className="th">Rol</th><th className="th">Estado</th><th className="th">Último acceso</th><th className="th text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td data-label="Usuario" className="td"><p className="font-medium">{u.fullName}{u.id === me?.id && <span className="ml-2 text-xs text-slate-500">(tú)</span>}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                    <td data-label="Rol" className="td"><Badge tone={u.role === 'SUPERADMIN' ? 'navy' : u.role === 'LAWYER' ? 'blue' : 'slate'}>{ROLE_LABELS[u.role]}</Badge></td>
                    <td data-label="Estado" className="td">{u.status === 'ACTIVE' ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Suspendido</Badge>}</td>
                    <td data-label="Último acceso" className="td text-slate-600">{u.lastLoginAt ? dateTime(u.lastLoginAt) : 'Nunca'}</td>
                    <td data-label="Acciones" className="td"><div className="flex justify-end gap-1">
                      <button className="btn-ghost px-2" aria-label={`Editar ${u.fullName}`} onClick={() => { setEditing(u); setEditRole(u.role); setEditStatus(u.status); }}><Pencil className="h-4 w-4" /></button>
                      <button className="btn-ghost px-2" aria-label={`Restablecer contraseña de ${u.fullName}`} onClick={() => setResetting(u)}><KeyRound className="h-4 w-4" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
        </TableCard>
      )}

      <Modal open={creating} onClose={() => !busy && setCreating(false)} title="Nuevo usuario" footer={<>
        <Button variant="outline" onClick={() => setCreating(false)} disabled={busy}>Cancelar</Button>
        <Button type="submit" form="new-user" loading={busy} disabled={newName.trim().length < 3 || !newEmail}>Crear usuario</Button>
      </>}>
        <form id="new-user" onSubmit={create} className="space-y-4">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}
          <Field label="Nombre completo">{(id) => <input id={id} required minLength={3} maxLength={120} className="input" value={newName} onChange={(e) => setNewName(e.target.value)} />}</Field>
          <Field label="Correo electrónico">{(id) => <input id={id} type="email" required className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />}</Field>
          <Field label="Rol" hint="Se generará una contraseña temporal que verás una sola vez.">{(id) => <select id={id} className="input" value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>{Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title={`Editar a ${editing?.fullName ?? ''}`} footer={<>
        <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancelar</Button>
        <Button loading={busy} onClick={() => void saveEdit()}>Guardar</Button>
      </>}>
        <div className="space-y-4">
          <Field label="Rol">{(id) => <select id={id} className="input" value={editRole} disabled={editing?.id === me?.id} onChange={(e) => setEditRole(e.target.value as Role)}>{Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
          <Field label="Estado" hint={editing?.id === me?.id ? 'No puedes cambiar tu propio rol ni suspenderte.' : 'Al suspender se cierran sus sesiones al instante.'}>{(id) => <select id={id} className="input" value={editStatus} disabled={editing?.id === me?.id} onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')}><option value="ACTIVE">Activo</option><option value="SUSPENDED">Suspendido</option></select>}</Field>
        </div>
      </Modal>

      <ConfirmModal open={!!resetting} title="Restablecer contraseña" confirmLabel="Generar contraseña temporal" loading={busy} onConfirm={() => void reset()} onClose={() => setResetting(null)}
        message={<>Se generará una contraseña temporal para <strong>{resetting?.fullName}</strong> y se cerrarán todas sus sesiones.</>} />

      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="Credenciales temporales" footer={<Button onClick={() => setCredentials(null)}>Listo</Button>}>
        {credentials && (
          <div className="space-y-3 text-sm">
            <p>Entrega estas credenciales a <strong>{credentials.name}</strong> por un canal seguro. <strong>No se volverán a mostrar.</strong></p>
            <dl className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Correo</dt><dd className="font-medium">{credentials.email}</dd>
              <dt className="mt-2 text-xs text-slate-500">Contraseña temporal</dt><dd className="flex items-center justify-between gap-2"><code className="font-mono text-base font-semibold">{credentials.password}</code>
                <button className="btn-outline px-2 py-1" onClick={() => navigator.clipboard.writeText(credentials.password).then(() => toast.success('Contraseña copiada'))}><Copy className="h-4 w-4" /> Copiar</button></dd></dl>
            <p className="text-xs text-slate-500">Recomienda cambiarla apenas ingrese (Configuración de cuenta).</p>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function UsersPage() {
  return <SuperOnly><Users /></SuperOnly>;
}
