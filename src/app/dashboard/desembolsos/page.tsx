'use client';

import { AlertTriangle, Banknote, CheckCircle2, Download, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/toast';
import { Button, Card, DisbursementBadge, EmptyState, ErrorBox, Field, Modal, PageHeader, PageLoader, TableCard } from '@/components/ui';
import { api } from '@/lib/api';
import { dateTime, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { useOnLive } from '@/lib/realtime';
import { DISBURSEMENT_STATUS_LABELS, type CaseItem, type Disbursement, type DisbursementStatus, type DocumentItem, type DocumentSummary, type Profile } from '@/lib/types';

export default function DisbursementsPage() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<DisbursementStatus | ''>('');
  const list = useFetch<Disbursement[]>(`/disbursements${status ? `?status=${status}` : ''}`);
  const docs = useFetch<{ items: DocumentItem[]; summary: DocumentSummary[] }>('/documents');
  const profile = useFetch<Profile>('/profile');
  const cases = useFetch<CaseItem[]>('/cases');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [caseId, setCaseId] = useState('');
  const [attached, setAttached] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useOnLive(() => void list.reload());

  const validated = (c: string) => (docs.data?.summary.find((s) => s.category === c)?.validated ?? 0) > 0;
  const requirements = [
    { ok: !!profile.data?.hasBankAccount && !!profile.data?.bankName, label: 'Datos bancarios completos', href: '/dashboard/perfil' },
    { ok: validated('IDENTITY'), label: 'Documento de identidad validado', href: '/dashboard/documentos' },
    { ok: validated('BANKING'), label: 'Soporte bancario validado', href: '/dashboard/documentos' },
  ];
  const ready = requirements.every((r) => r.ok);
  const supportDocs = (docs.data?.items ?? []).filter((d) => d.status === 'VALIDATED');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const created = await api.post<Disbursement>('/disbursements', { amount: Number(amount), concept, caseId: caseId || undefined, documentIds: attached.length ? attached : undefined });
      toast.success(`Solicitud ${created.code} creada`);
      router.push(`/dashboard/desembolsos/${created.id}`);
    } catch (err) {
      setFormError((err as Error).message);
      setBusy(false);
    }
  }

  if ((list.loading && !list.data) || docs.loading || profile.loading) return <PageLoader />;

  return (
    <>
      <PageHeader title="Solicitudes de desembolso" description="Crea una solicitud y sigue su estado hasta que el desembolso se complete."
        actions={<>
          <a href="/api/disbursements/export.csv" className="btn-outline"><Download className="h-4 w-4" /> Historial CSV</a>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nueva solicitud</Button>
        </>} />

      {!ready && (
        <Card className="mb-5 border-gold-300 bg-gold-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-gold-800"><AlertTriangle className="h-4 w-4" aria-hidden /> Antes de solicitar un desembolso necesitas:</p>
          <ul className="mt-2 space-y-1 text-sm">
            {requirements.map((r) => (
              <li key={r.label} className="flex items-center gap-2">
                {r.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden /> : <span className="h-4 w-4 rounded-full border-2 border-gold-500" aria-hidden />}
                {r.ok ? <span className="text-slate-500">{r.label}</span> : <Link href={r.href} className="font-medium text-navy-800 underline">{r.label}</Link>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-3 flex items-center gap-2">
        <label htmlFor="f-status" className="text-sm text-slate-600">Estado</label>
        <select id="f-status" className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as DisbursementStatus | '')}>
          <option value="">Todos</option>
          {Object.entries(DISBURSEMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {list.error && <ErrorBox message={list.error} onRetry={list.reload} />}
      <TableCard>
        {(list.data ?? []).length === 0 ? (
          <EmptyState icon={<Banknote className="h-10 w-10" />} title="No hay solicitudes para mostrar">Cuando crees una solicitud aparecerá aquí con su historial.</EmptyState>
        ) : (
          <table className="rtable w-full">
            <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Código</th><th className="th">Fecha</th><th className="th">Concepto</th><th className="th text-right">Monto</th><th className="th">Estado</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.data!.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td data-label="Código" className="td font-medium"><Link href={`/dashboard/desembolsos/${d.id}`} className="text-navy-700 underline">{d.code}</Link></td>
                  <td data-label="Fecha" className="td text-slate-600">{dateTime(d.createdAt)}</td>
                  <td data-label="Concepto" className="td max-w-xs truncate">{d.concept}</td>
                  <td data-label="Monto" className="td text-right tabular-nums">{money(d.amount, d.currency)}</td>
                  <td data-label="Estado" className="td"><DisbursementBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Nueva solicitud de desembolso" footer={<>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
        <Button type="submit" form="new-disbursement" loading={busy} disabled={!ready || !amount || concept.trim().length < 3}>Enviar solicitud</Button>
      </>}>
        <form id="new-disbursement" onSubmit={submit} className="space-y-4">
          {!ready && <p className="rounded-lg bg-gold-50 px-3 py-2 text-sm text-gold-800">Completa los requisitos indicados en la página para poder enviar la solicitud.</p>}
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}
          <Field label="Monto solicitado (USD)">{(id) => <input id={id} type="number" min="1" step="0.01" required className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
          <Field label="Concepto">{(id) => <input id={id} required minLength={3} maxLength={200} className="input" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej. Recuperación de capital invertido" />}</Field>
          {(cases.data ?? []).length > 0 && (
            <Field label="Caso asociado (opcional)">
              {(id) => (
                <select id={id} className="input" value={caseId} onChange={(e) => setCaseId(e.target.value)}>
                  <option value="">Sin caso asociado</option>
                  {cases.data!.map((c) => <option key={c.id} value={c.id}>{c.number} — {c.title}</option>)}
                </select>
              )}
            </Field>
          )}
          {supportDocs.length > 0 && (
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-slate-700">Adjuntar documentos validados (opcional)</legend>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {supportDocs.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={attached.includes(d.id)} onChange={(e) => setAttached(e.target.checked ? [...attached, d.id] : attached.filter((x) => x !== d.id))} />
                    <span className="truncate">{d.originalName}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <p className="text-xs text-slate-500">Se desembolsará a la cuenta {profile.data?.accountNumberMasked ?? '—'} ({profile.data?.bankName ?? 'sin banco'}).</p>
        </form>
      </Modal>
    </>
  );
}
