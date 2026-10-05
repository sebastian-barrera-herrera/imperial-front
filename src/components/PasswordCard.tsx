'use client';

import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useToast } from './toast';
import { Button, Card, Field } from './ui';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{10,72}$/;

export function PasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weak = next && !PASSWORD_RULE.test(next) ? 'Mínimo 10 caracteres, con al menos una letra y un número.' : null;
  const mismatch = confirm && confirm !== next ? 'Las contraseñas no coinciden.' : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      toast.success('Contraseña actualizada. Cerramos tus otras sesiones por seguridad.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Contraseña</h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:max-w-md">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
        <Field label="Contraseña actual">{(id) => <input id={id} type="password" autoComplete="current-password" required className="input" value={current} onChange={(e) => setCurrent(e.target.value)} />}</Field>
        <Field label="Nueva contraseña" error={weak}>{(id) => <input id={id} type="password" autoComplete="new-password" required className="input" value={next} onChange={(e) => setNext(e.target.value)} />}</Field>
        <Field label="Confirmar nueva contraseña" error={mismatch}>{(id) => <input id={id} type="password" autoComplete="new-password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}</Field>
        <div><Button type="submit" loading={busy} disabled={!current || !PASSWORD_RULE.test(next) || next !== confirm}>Cambiar contraseña</Button></div>
      </form>
    </Card>
  );
}
