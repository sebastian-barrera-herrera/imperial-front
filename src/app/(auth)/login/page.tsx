'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Button, Field } from '@/components/ui';
import { homeFor, safeNext, useAuth } from '@/lib/auth';
import { AuthShell } from '../AuthShell';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      router.replace(safeNext(params.get('next'), homeFor(user.role)));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <Field label="Correo electrónico">
        {(id) => <input id={id} type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      <Field label="Contraseña">
        {(id) => <input id={id} type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Field>
      <Button type="submit" loading={busy} className="w-full" disabled={!email || !password}>Ingresar</Button>
      <p className="text-center text-sm text-slate-600">¿Aún no tienes cuenta? <Link href="/register" className="font-medium text-navy-700 underline">Crear cuenta</Link></p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Ingresa a tu cuenta" subtitle="Accede a tus documentos, solicitudes y casos.">
      <Suspense><LoginForm /></Suspense>
    </AuthShell>
  );
}
