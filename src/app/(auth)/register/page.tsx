'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { AuthShell } from '../AuthShell';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{10,72}$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordError = password && !PASSWORD_RULE.test(password) ? 'Mínimo 10 caracteres, con al menos una letra y un número.' : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(fullName.trim(), email.trim(), password, accepted);
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Comienza a gestionar tu caso en minutos.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        <Field label="Nombre completo">
          {(id) => <input id={id} autoComplete="name" required className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />}
        </Field>
        <Field label="Correo electrónico">
          {(id) => <input id={id} type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field label="Contraseña" error={passwordError} hint="Mínimo 10 caracteres, con letras y números.">
          {(id) => <input id={id} type="password" autoComplete="new-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 accent-[rgb(var(--brand))]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
          <span>
            He leído y acepto el <Link href="/aviso-de-privacidad" target="_blank" rel="noopener" className="font-medium text-navy-700 underline">Aviso de privacidad</Link> y
            la <Link href="/privacidad" target="_blank" rel="noopener" className="font-medium text-navy-700 underline">Política de privacidad</Link>, y autorizo el
            tratamiento de mis datos personales y financieros para la gestión de mi caso.
          </span>
        </label>
        <Button type="submit" loading={busy} className="w-full" disabled={!fullName.trim().length || !email || !PASSWORD_RULE.test(password) || !accepted}>Crear cuenta</Button>
        <p className="text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link href="/login" className="font-medium text-navy-700 underline">Ingresar</Link></p>
      </form>
    </AuthShell>
  );
}
