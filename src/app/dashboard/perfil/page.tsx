'use client';

import { Lock, Pencil } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '@/components/toast';
import { Button, Card, ErrorBox, Field, PageHeader, PageLoader } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFetch } from '@/lib/hooks';
import { ACCOUNT_TYPE_LABELS, type Profile } from '@/lib/types';

type Form = { fullName: string; cedula: string; phone: string; address: string; city: string; bankName: string; accountType: string; accountNumber: string };
const toForm = (p: Profile): Form => ({ fullName: p.fullName, cedula: p.cedula ?? '', phone: p.phone ?? '', address: p.address ?? '', city: p.city ?? '', bankName: p.bankName ?? '', accountType: p.accountType ?? '', accountNumber: '' });

export default function ProfilePage() {
  const toast = useToast();
  const { reload: reloadUser } = useAuth();
  const { data, error, loading, setData } = useFetch<Profile>('/profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data && !editing) setForm(toForm(data));
  }, [data, editing]);

  if (loading) return <PageLoader />;
  if (error || !data || !form) return <ErrorBox message={error ?? 'No se pudo cargar tu perfil'} />;

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    // Solo se envían los campos con valor; un número de cuenta vacío conserva el actual.
    const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim() !== ''));
    try {
      const updated = await api.put<Profile>('/profile', body);
      setData(updated);
      await reloadUser();
      setEditing(false);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const readOnly = !editing;
  return (
    <>
      <PageHeader title="Mi perfil" description="Mantén tus datos al día: los usamos para validar tu identidad y realizar tus desembolsos."
        actions={!editing && <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Editar información</Button>} />

      <form onSubmit={save} className="space-y-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Información personal</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo">{(id) => <input id={id} className="input" value={form.fullName} onChange={set('fullName')} disabled={readOnly} required minLength={3} />}</Field>
            <Field label="Correo de contacto" hint="Para cambiar el correo contacta a tu abogado.">{(id) => <input id={id} className="input" value={data.email} disabled />}</Field>
            <Field label="Cédula de identidad">{(id) => <input id={id} className="input" value={form.cedula} onChange={set('cedula')} disabled={readOnly} inputMode="numeric" pattern="[A-Za-z0-9.\-]{5,20}" title="5 a 20 caracteres: letras, números, punto o guion" />}</Field>
            <Field label="Teléfono">{(id) => <input id={id} type="tel" className="input" value={form.phone} onChange={set('phone')} disabled={readOnly} placeholder="+código de país y número" />}</Field>
            <Field label="Ciudad">{(id) => <input id={id} className="input" value={form.city} onChange={set('city')} disabled={readOnly} />}</Field>
            <Field label="Dirección">{(id) => <input id={id} className="input" value={form.address} onChange={set('address')} disabled={readOnly} />}</Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Datos bancarios</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><Lock className="h-3.5 w-3.5" aria-hidden /> Se almacenan cifrados. Solo verás los últimos 4 dígitos.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Banco">{(id) => <input id={id} className="input" value={form.bankName} onChange={set('bankName')} disabled={readOnly} />}</Field>
            <Field label="Tipo de cuenta">
              {(id) => (
                <select id={id} className="input" value={form.accountType} onChange={set('accountType')} disabled={readOnly}>
                  <option value="">Selecciona…</option>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Número de cuenta" hint={editing && data.hasBankAccount ? 'Déjalo vacío para conservar la cuenta actual.' : undefined} className="sm:col-span-2">
              {(id) => editing
                ? <input id={id} className="input" inputMode="numeric" value={form.accountNumber} onChange={set('accountNumber')} placeholder={data.accountNumberMasked ?? 'Solo dígitos'} autoComplete="off" />
                : <input id={id} className="input" value={data.accountNumberMasked ?? 'Sin registrar'} disabled />}
            </Field>
          </div>
        </Card>

        {editing && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setForm(toForm(data)); setEditing(false); }}>Cancelar</Button>
            <Button type="submit" loading={busy}>Guardar cambios</Button>
          </div>
        )}
      </form>
    </>
  );
}
