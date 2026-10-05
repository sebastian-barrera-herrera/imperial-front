'use client';

import { Plus } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useToast } from '@/components/toast';
import { Button, ConfirmModal, EmptyState, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { refreshPublicSite } from './actions';
import { ContentCard } from './ContentCard';
import { PhotoField } from './PhotoField';

export type Photo = { id: string | null; url: string | null };
type Meta = { id: string; photoUrl: string | null; published: boolean; isSample: boolean };

type Config<T extends Meta, F> = {
  /** Segmento de la API: `team` o `testimonials`. */
  path: 'team' | 'testimonials';
  singular: string;
  addLabel: string;
  empty: string;
  authText: string;
  items: T[];
  blank: F;
  fromItem: (item: T) => F;
  /** Nombre que identifica a la persona (para el avatar y los avisos). */
  nameOf: (form: F) => string;
  /** Campos del formulario según el estado actual. */
  fields: (form: F, set: (patch: Partial<F>) => void) => ReactNode;
  /** Qué se envía a la API. */
  body: (form: F) => Record<string, unknown>;
  /** ¿Este cambio exige reconfirmar la autorización? (refleja la regla de la API.) */
  needsAuth: (item: T | null, form: F, photoChanged: boolean) => boolean;
  /** Tarjeta de la lista. */
  card: (item: T) => { name: string; title?: string; body: ReactNode };
  /** Validación mínima antes de enviar. */
  valid: (form: F) => boolean;
  reload: () => Promise<void>;
};

/** Lista + alta/edición/orden/ocultar/eliminar de un tipo de contenido (equipo o testimonios). */
export function ContentSection<T extends Meta, F extends object>(c: Config<T, F>) {
  const toast = useToast();
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [form, setForm] = useState<F>(c.blank);
  const [photo, setPhoto] = useState<Photo>({ id: null, url: null });
  const [photoChanged, setPhotoChanged] = useState(false);
  const [published, setPublished] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<T | null>(null);

  const item = editing && editing !== 'new' ? editing : null;
  const needsAuth = editing === 'new' || (editing !== null && c.needsAuth(item, form, photoChanged));

  function open(target: T | 'new') {
    setEditing(target);
    setError(null);
    setAuthorized(false);
    setPhotoChanged(false);
    if (target === 'new') {
      setForm(c.blank);
      setPhoto({ id: null, url: null });
      setPublished(true);
    } else {
      setForm(c.fromItem(target));
      setPhoto({ id: target.photoUrl ? 'current' : null, url: target.photoUrl });
      setPublished(target.published);
    }
  }

  const done = async (message: string) => {
    toast.success(message);
    await c.reload();
    void refreshPublicSite();
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const base = { ...c.body(form), published, ...(needsAuth ? { authorized: true } : {}) };
    // `photoId` solo se envía si cambió: así no se pide reautorizar por editar otros campos.
    const payload = photoChanged ? { ...base, photoId: photo.id === 'current' ? undefined : photo.id } : base;
    try {
      if (editing === 'new') await api.post(`/admin/content/${c.path}`, payload);
      else if (item) await api.patch(`/admin/content/${c.path}/${item.id}`, payload);
      setEditing(null);
      await done(editing === 'new' ? `${c.singular} añadido` : 'Cambios guardados');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(fn: () => Promise<unknown>, message: string) {
    try {
      await fn();
      await done(message);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const move = (index: number, dir: -1 | 1) => {
    const ids = c.items.map((i) => i.id);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    return act(() => api.put(`/admin/content/${c.path}/order`, { ids }), 'Orden actualizado');
  };

  const canSave = c.valid(form) && (!needsAuth || authorized) && !busy;

  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => open('new')}><Plus className="h-4 w-4" aria-hidden /> {c.addLabel}</Button></div>
      {c.items.length === 0 ? (
        <div className="card"><EmptyState title={c.empty} /></div>
      ) : (
        <ul className="space-y-3">
          {c.items.map((it, i) => {
            const v = c.card(it);
            return (
              <ContentCard key={it.id} name={v.name} title={v.title} photoUrl={it.photoUrl} published={it.published} isSample={it.isSample} first={i === 0} last={i === c.items.length - 1}
                onMove={(d) => void move(i, d)} onEdit={() => open(it)} onDelete={() => setToDelete(it)}
                onToggle={() => void act(() => api.patch(`/admin/content/${c.path}/${it.id}`, { published: !it.published }), it.published ? 'Oculto en la web' : 'Publicado en la web')}>
                {v.body}
              </ContentCard>
            );
          })}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => !busy && setEditing(null)} title={editing === 'new' ? c.addLabel : `Editar ${c.singular.toLowerCase()}`} size="lg"
        footer={<>
          <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancelar</Button>
          <Button type="submit" form="content-form" loading={busy} disabled={!canSave}>Guardar</Button>
        </>}>
        <form id="content-form" onSubmit={save} className="space-y-4">
          {c.fields(form, (patch) => setForm({ ...form, ...patch }))}
          <PhotoField name={c.nameOf(form)} previewUrl={photo.url} hasPhoto={photo.id !== null}
            onChange={(p) => { setPhoto(p ? { id: p.id, url: p.url } : { id: null, url: null }); setPhotoChanged(true); }} />
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            <span>Mostrar en la página pública</span>
          </label>
          {needsAuth ? (
            <label className="flex items-start gap-3 rounded-lg border border-gold-300 bg-gold-50 p-3 text-sm text-slate-800">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} />
              <span><strong>Confirmo {c.authText}.</strong> Queda registrado quién lo confirmó y cuándo.</span>
            </label>
          ) : (
            <p className="text-xs text-slate-500">Cambiar solo textos de apoyo, el orden o la visibilidad no requiere volver a confirmar la autorización.</p>
          )}
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        </form>
      </Modal>

      <ConfirmModal open={toDelete !== null} danger title={`Eliminar ${c.singular.toLowerCase()}`} confirmLabel="Eliminar" loading={busy} onClose={() => setToDelete(null)}
        message={<>Se quitará de la web y se borrará su foto. Esta acción no se puede deshacer.</>}
        onConfirm={async () => {
          if (!toDelete) return;
          setBusy(true);
          const target = toDelete;
          setToDelete(null);
          await act(() => api.delete(`/admin/content/${c.path}/${target.id}`), `${c.singular} eliminado`);
          setBusy(false);
        }} />
    </>
  );
}
