'use client';

import { Calculator, FileText, Landmark, LineChart, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useToast } from '@/components/toast';
import { OpportunityPerformance } from '@/components/OpportunityPerformance';
import { Delta, Sparkline } from '@/components/markets';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Modal, PageHeader, PageLoader, StatTile, Tabs } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { money, percent, unitMoney } from '@/lib/format';
import { useDebounced, useFetch } from '@/lib/hooks';
import { RISK_LABELS, type Interest, type Opportunity, type Simulation } from '@/lib/types';

type Tab = 'oportunidades' | 'simulador' | 'politicas';

const RISK_TONE = { LOW: 'green', MEDIUM: 'amber', HIGH: 'red' } as const;

function BalanceChart({ schedule, principal }: { schedule: Simulation['schedule']; principal: number }) {
  const w = 600, h = 180, pad = 8;
  const max = Math.max(...schedule.map((s) => s.balance), principal);
  const x = (i: number) => pad + (i / Math.max(schedule.length - 1, 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - principal * 0.95) / (max - principal * 0.95 || 1)) * (h - pad * 2);
  const line = schedule.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.balance).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img" aria-label="Evolución del saldo mes a mes">
      <path d={`${line} L${x(schedule.length - 1)},${h - pad} L${x(0)},${h - pad} Z`} className="fill-gold-100" />
      <path d={line} className="fill-none stroke-gold-600" strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  );
}

function Simulator({ defaults }: { defaults?: { principal: number; rate: number; months: number } }) {
  const [principal, setPrincipal] = useState(String(defaults?.principal ?? 10_000_000));
  const [rate, setRate] = useState(String(defaults?.rate ?? 12));
  const [months, setMonths] = useState(String(defaults?.months ?? 12));
  const [mode, setMode] = useState<'COMPOUND' | 'SIMPLE'>('COMPOUND');
  const [result, setResult] = useState<Simulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const input = useDebounced({ principal: Number(principal), annualRate: Number(rate), termMonths: Number(months), mode }, 350);

  useEffect(() => {
    const { principal: p, annualRate: r, termMonths: m } = input;
    if (!(p >= 1) || !(r > 0 && r <= 100) || !Number.isInteger(m) || m < 1 || m > 120) {
      setError('Revisa los valores: monto desde 1, tasa entre 0,001 y 100 %, plazo de 1 a 120 meses.');
      return;
    }
    let cancelled = false;
    api.post<Simulation>('/investments/simulate', input)
      .then((r2) => { if (!cancelled) { setResult(r2); setError(null); } })
      .catch((e: ApiError) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [input]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="h-fit p-5">
        <h2 className="text-lg font-semibold">Simulador</h2>
        <div className="mt-4 space-y-4">
          <Field label="Monto a invertir (USD)">{(id) => <input id={id} type="number" min="1" className="input" value={principal} onChange={(e) => setPrincipal(e.target.value)} />}</Field>
          <Field label="Tasa nominal anual (%)">{(id) => <input id={id} type="number" min="0.001" max="100" step="0.001" className="input" value={rate} onChange={(e) => setRate(e.target.value)} />}</Field>
          <Field label="Plazo (meses)">{(id) => <input id={id} type="number" min="1" max="120" step="1" className="input" value={months} onChange={(e) => setMonths(e.target.value)} />}</Field>
          <Field label="Tipo de interés">
            {(id) => <select id={id} className="input" value={mode} onChange={(e) => setMode(e.target.value as 'COMPOUND' | 'SIMPLE')}><option value="COMPOUND">Compuesto (mensual)</option><option value="SIMPLE">Simple</option></select>}
          </Field>
        </div>
      </Card>

      <div className="space-y-4 lg:col-span-2">
        {error && <ErrorBox message={error} />}
        {result ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatTile label="Capital" value={money(result.principal)} />
              <StatTile label="Intereses estimados" value={money(result.totalInterest)} />
              <StatTile label="Total al vencimiento" value={money(result.finalAmount)} tone="alert" hint={`Tasa efectiva anual ≈ ${percent(result.effectiveAnnualRate)}`} />
            </div>
            <Card className="p-4"><h3 className="mb-1 font-sans text-sm font-semibold text-slate-700">Evolución del saldo ({result.termMonths} meses)</h3><BalanceChart schedule={result.schedule} principal={result.principal} /></Card>
            <Card className="overflow-hidden">
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-right">
                  <caption className="sr-only">Proyección mensual</caption>
                  <thead className="sticky top-0 border-b border-slate-200 bg-slate-50"><tr><th className="th text-left">Mes</th><th className="th text-right">Interés del mes</th><th className="th text-right">Saldo</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(showAll ? result.schedule : result.schedule.slice(0, 12)).map((r) => <tr key={r.month}><td className="td text-left">{r.month}</td><td className="td tabular-nums">{money(r.interest)}</td><td className="td tabular-nums">{money(r.balance)}</td></tr>)}
                  </tbody>
                </table>
              </div>
              {result.schedule.length > 12 && <button className="w-full border-t border-slate-200 py-2 text-sm font-medium text-navy-700 hover:bg-slate-50" onClick={() => setShowAll(!showAll)}>{showAll ? 'Ver menos' : `Ver los ${result.schedule.length} meses`}</button>}
            </Card>
            <p className="text-xs text-slate-500">Proyección informativa: no constituye una oferta ni garantiza rendimientos. Las inversiones implican riesgo de pérdida de capital.</p>
          </>
        ) : !error && <PageLoader label="Calculando…" />}
      </div>
    </div>
  );
}

function Opportunities({ onSimulate }: { onSimulate: (o: Opportunity) => void }) {
  const toast = useToast();
  const params = useSearchParams();
  const list = useFetch<Opportunity[]>('/investments/opportunities');
  const mine = useFetch<Interest[]>('/investments/interests');
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [perf, setPerf] = useState<Opportunity | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const highlighted = params.get('oportunidad');
  useEffect(() => {
    if (highlighted && list.data) setSelected(list.data.find((o) => o.id === highlighted) ?? null);
  }, [highlighted, list.data]);

  function open(o: Opportunity) { setSelected(o); setAmount(String(Number(o.minAmount))); setMessage(''); setError(null); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/investments/opportunities/${selected.id}/interest`, { amount: Number(amount), message: message.trim() || undefined });
      toast.success('Recibimos tu solicitud. Nuestro equipo se pondrá en contacto contigo.');
      setSelected(null);
      await mine.reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (list.loading && !list.data) return <PageLoader />;
  if (list.error) return <ErrorBox message={list.error} onRetry={list.reload} />;

  return (
    <>
      {(list.data ?? []).length === 0 ? (
        <Card><EmptyState icon={<Landmark className="h-10 w-10" />} title="No hay oportunidades abiertas por ahora">Te avisaremos en tu centro de alertas cuando se publique una nueva.</EmptyState></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.data!.map((o) => (
            <Card key={o.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2"><h2 className="text-lg font-semibold">{o.title}</h2><Badge tone={RISK_TONE[o.risk]}>Riesgo {RISK_LABELS[o.risk].toLowerCase()}</Badge></div>
              <p className="mt-2 flex-1 text-sm text-slate-600">{o.summary}</p>
              {o.quote?.latestValue != null && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Valor por unidad</p>
                    <p className="text-xl font-semibold tabular-nums text-slate-900">{unitMoney(o.quote.latestValue)}</p>
                    <p className="text-xs text-slate-500"><Delta value={o.quote.sinceInceptionPct} /> desde el inicio</p>
                  </div>
                  <Sparkline points={o.quote.sparkline} width={112} height={36} />
                </div>
              )}
              <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-xs text-slate-500">Tasa anual</dt><dd className="font-semibold">{percent(Number(o.annualRate))}</dd></div>
                <div><dt className="text-xs text-slate-500">Plazo</dt><dd className="font-semibold">{o.termMonths} meses</dd></div>
                <div><dt className="text-xs text-slate-500">Desde</dt><dd className="font-semibold">{money(o.minAmount)}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => open(o)}>Términos y participar</Button><Button variant="outline" onClick={() => setPerf(o)}><LineChart className="h-4 w-4" /> Rendimiento</Button><Button variant="outline" onClick={() => onSimulate(o)}><Calculator className="h-4 w-4" /> Simular</Button></div>
            </Card>
          ))}
        </div>
      )}

      {(mine.data ?? []).length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="text-lg font-semibold">Mis solicitudes de participación</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {mine.data!.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span>{i.opportunity.title} · {money(i.amount)}</span><Badge tone={i.status === 'PENDING' ? 'amber' : i.status === 'CONTACTED' ? 'green' : 'slate'}>{{ PENDING: 'En revisión', CONTACTED: 'Contactado', DISCARDED: 'Descartada' }[i.status]}</Badge></li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!perf} onClose={() => setPerf(null)} title={perf?.title ?? ''} size="lg">
        {perf && <OpportunityPerformance opportunityId={perf.id} />}
      </Modal>

      <Modal open={!!selected} onClose={() => !busy && setSelected(null)} title={selected?.title ?? ''} size="lg" footer={<>
        <Button variant="outline" onClick={() => setSelected(null)} disabled={busy}>Cerrar</Button>
        <Button type="submit" form="interest-form" loading={busy} disabled={!amount}>Solicitar participación</Button>
      </>}>
        {selected && (
          <form id="interest-form" onSubmit={submit} className="space-y-4">
            <p className="text-sm text-slate-700">{selected.summary}</p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-slate-500">Tasa anual</dt><dd className="font-semibold">{percent(Number(selected.annualRate))}</dd></div>
              <div><dt className="text-xs text-slate-500">Plazo</dt><dd className="font-semibold">{selected.termMonths} meses</dd></div>
              <div><dt className="text-xs text-slate-500">Mínimo</dt><dd className="font-semibold">{money(selected.minAmount)}</dd></div>
              <div><dt className="text-xs text-slate-500">Máximo</dt><dd className="font-semibold">{selected.maxAmount ? money(selected.maxAmount) : 'Sin tope'}</dd></div>
            </dl>
            <div><h3 className="text-sm font-semibold">Términos</h3><p className="mt-1 whitespace-pre-line text-sm text-slate-600">{selected.terms}</p></div>
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
            <Field label="Monto con el que quieres participar (USD)">{(id) => <input id={id} type="number" required min={Number(selected.minAmount)} max={selected.maxAmount ? Number(selected.maxAmount) : undefined} step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
            <Field label="Mensaje (opcional)">{(id) => <textarea id={id} rows={2} maxLength={500} className="input" value={message} onChange={(e) => setMessage(e.target.value)} />}</Field>
            <p className="text-xs text-slate-500">Enviar esta solicitud no compromete fondos: nuestro equipo te contactará para formalizar los términos.</p>
          </form>
        )}
      </Modal>
    </>
  );
}

// Texto de referencia de políticas. Debe ser revisado y reemplazado por el contenido aprobado por el despacho antes de operar.
const POLICIES = [
  { title: 'Cómo funcionan las oportunidades', text: 'Cada oportunidad describe el plazo, la tasa nominal anual estimada, los montos mínimo y máximo y el nivel de riesgo. Al solicitar participación, el equipo del despacho te contacta para formalizar condiciones por escrito antes de cualquier movimiento de fondos.' },
  { title: 'Riesgos', text: 'Toda inversión implica riesgo, incluida la pérdida parcial o total del capital. Las tasas y proyecciones son estimaciones y no constituyen garantía de rendimiento. Evalúa tu situación financiera antes de participar.' },
  { title: 'Privacidad y tratamiento de datos', text: 'Tus datos de identidad y bancarios se almacenan cifrados y solo accede a ellos el personal autorizado del despacho; cada consulta queda registrada en un historial de auditoría.' },
  { title: 'Desembolsos', text: 'Los desembolsos se realizan únicamente a la cuenta registrada en tu perfil y requieren que tus documentos de identidad y bancarios estén validados por el equipo.' },
];

function Policies() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4 text-sm text-gold-900"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Esta información es de carácter general. Para condiciones específicas, consulta con tu abogado.</div>
      {POLICIES.map((p) => <Card key={p.title} className="p-5"><h2 className="flex items-center gap-2 text-lg font-semibold"><FileText className="h-4 w-4 text-navy-400" aria-hidden /> {p.title}</h2><p className="mt-2 text-sm text-slate-600">{p.text}</p></Card>)}
    </div>
  );
}

function CapitalContent() {
  const [tab, setTab] = useState<Tab>('oportunidades');
  const [defaults, setDefaults] = useState<{ principal: number; rate: number; months: number } | undefined>();
  const tabs = useMemo(() => [{ id: 'oportunidades' as const, label: 'Oportunidades' }, { id: 'simulador' as const, label: 'Simulador' }, { id: 'politicas' as const, label: 'Documentación y políticas' }], []);

  return (
    <>
      <PageHeader title="Capital e inversión" description="Conoce las oportunidades disponibles, simula rendimientos y revisa las condiciones." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      <div className="mt-5">
        {tab === 'oportunidades' && <Opportunities onSimulate={(o) => { setDefaults({ principal: Number(o.minAmount), rate: Number(o.annualRate), months: o.termMonths }); setTab('simulador'); }} />}
        {tab === 'simulador' && <Simulator key={JSON.stringify(defaults)} defaults={defaults} />}
        {tab === 'politicas' && <Policies />}
      </div>
    </>
  );
}

export default function CapitalPage() {
  return <Suspense fallback={<PageLoader />}><CapitalContent /></Suspense>;
}
