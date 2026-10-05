'use client';

import { CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { BrandInline } from '@/components/Brand';
import { SiteFooter } from '@/components/LegalPage';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button, Card, Field, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money } from '@/lib/format';
import Link from 'next/link';

type Result =
  | { valid: true; reference: string; status: string; amount: string; currency: string; approvedAt: string; beneficiary: string }
  | { valid: false };

function Verify() {
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get('ref') ?? '');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(r = ref, c = code) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.get<Result>(`/public/verify?ref=${encodeURIComponent(r.trim())}&code=${encodeURIComponent(c.trim())}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Al llegar desde el QR del PDF (?ref=…&code=…) se verifica de inmediato.
  useEffect(() => {
    const r = params.get('ref');
    const c = params.get('code');
    if (r && c) void verify(r, c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void verify();
  };

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl"><ShieldCheck className="h-7 w-7 text-navy-600" aria-hidden /> Verificación de documentos</h1>
      <p className="mt-2 text-slate-600">Comprueba que un documento de aprobación de desembolso fue emitido por Imperial Law Group y que sus datos no han sido alterados. Si llegaste desde el código QR del documento, se verifica automáticamente.</p>

      <Card className="mt-6 p-5">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Referencia del documento">{(id) => <input id={id} className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="DES-000001" autoComplete="off" required />}</Field>
          <Field label="Código de verificación">{(id) => <input id={id} className="input font-mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" autoComplete="off" required />}</Field>
          <Button type="submit" loading={busy} disabled={!ref.trim() || !code.trim()}>Verificar</Button>
        </form>
      </Card>

      <div aria-live="polite" className="mt-6">
        {busy && <p className="flex items-center gap-2 text-sm text-slate-600"><Spinner /> Verificando…</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {result?.valid === true && (
          <Card className="border-green-200 p-5">
            <p className="flex items-center gap-2 text-lg font-semibold text-green-800"><CheckCircle2 className="h-6 w-6" aria-hidden /> Documento auténtico y vigente</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Referencia</dt><dd className="font-medium">{result.reference}</dd></div>
              <div><dt className="text-slate-500">Estado actual</dt><dd className="font-medium">{result.status}</dd></div>
              <div><dt className="text-slate-500">Monto aprobado</dt><dd className="font-medium">{money(result.amount, result.currency)}</dd></div>
              <div><dt className="text-slate-500">Fecha de aprobación</dt><dd className="font-medium">{date(result.approvedAt)}</dd></div>
              <div><dt className="text-slate-500">Beneficiario</dt><dd className="font-medium">{result.beneficiary}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">Compara estos datos con los del documento que tienes. Por privacidad solo se muestran las iniciales del beneficiario.</p>
          </Card>
        )}
        {result?.valid === false && (
          <Card className="border-red-200 p-5">
            <p className="flex items-center gap-2 text-lg font-semibold text-red-800"><ShieldAlert className="h-6 w-6" aria-hidden /> No pudimos verificar este documento</p>
            <p className="mt-2 text-sm text-slate-700">La referencia y el código no coinciden con ningún documento vigente. Puede que el código esté mal copiado, que los datos hayan sido alterados o que la solicitud ya no esté aprobada. Si crees que se trata de un error, comunícate con el despacho.</p>
          </Card>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Inicio"><BrandInline markWidth={40} /></Link>
          <div className="flex items-center gap-1"><ThemeToggle /><Link href="/login" className="btn-ghost">Ingresar</Link></div>
        </div>
      </header>
      <Suspense fallback={<div className="flex-1" />}><Verify /></Suspense>
      <SiteFooter />
    </div>
  );
}
