'use client';

import { ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { SuperOnly } from '@/components/SuperOnly';
import { useToast } from '@/components/toast';
import { Button, Card, EmptyState, ErrorBox, Field, PageHeader, PageLoader, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { useFetch } from '@/lib/hooks';
import type { AdminContent, AdminTeamMember, AdminTestimonial } from '@/lib/types';
import { refreshPublicSite } from './actions';
import { ContentSection } from './ContentSection';

type TeamForm = { name: string; role: string; bio: string };
type TestimonialForm = { quote: string; author: string; kind: string };

function Content() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch<AdminContent>('/admin/content');
  const [tab, setTab] = useState<'team' | 'testimonials'>('team');
  const [busy, setBusy] = useState(false);

  async function loadSamples() {
    setBusy(true);
    try {
      await api.post('/admin/content/samples');
      toast.success('Contenido de ejemplo cargado. Edítalo para reemplazarlo por el real.');
      await reload();
      void refreshPublicSite();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Contenido del sitio" description="Edita el equipo y los testimonios que aparecen en la página pública: textos, nombres, fotos y orden."
        actions={<a href="/" target="_blank" rel="noreferrer" className="btn-outline">Ver sitio <ExternalLink className="h-4 w-4" aria-hidden /></a>} />

      <Card className="mb-5 flex gap-3 p-4 text-sm text-slate-700">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden />
        <p>Publica solo <strong>personas reales y con su autorización escrita</strong>. Al crear un perfil o testimonio, o al cambiar su texto, nombre o foto, debes confirmarlo y queda registrado. Mientras haya contenido de ejemplo, la web lo muestra rotulado como «ilustrativo».</p>
      </Card>

      {loading && !data ? <PageLoader /> : error || !data ? <ErrorBox message={error ?? 'No se pudo cargar el contenido'} onRetry={reload} /> : data.team.length + data.testimonials.length === 0 ? (
        <Card>
          <EmptyState icon={<FileText className="h-10 w-10" />} title="Aún no hay contenido propio">
            Mientras tanto, la web muestra un contenido de respaldo ilustrativo. Puedes cargar ese ejemplo para editarlo, o empezar desde cero con el botón «Añadir» de abajo.
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={loadSamples} loading={busy}>Cargar contenido de ejemplo</Button>
            </div>
          </EmptyState>
          <div className="border-t border-slate-200 p-5">
            <Sections data={data} tab={tab} setTab={setTab} reload={reload} />
          </div>
        </Card>
      ) : (
        <Sections data={data} tab={tab} setTab={setTab} reload={reload} />
      )}
    </>
  );
}

function Sections({ data, tab, setTab, reload }: { data: AdminContent; tab: 'team' | 'testimonials'; setTab: (t: 'team' | 'testimonials') => void; reload: () => Promise<void> }) {
  return (
    <>
      <Tabs tabs={[{ id: 'team', label: 'Equipo', count: data.team.length }, { id: 'testimonials', label: 'Testimonios', count: data.testimonials.length }]} value={tab} onChange={setTab} />
      <div className="mt-5">
        {tab === 'team' ? (
          <ContentSection<AdminTeamMember, TeamForm>
            key="team" path="team" singular="Perfil" addLabel="Añadir perfil" empty="No hay perfiles del equipo todavía"
            authText="que esta persona es real y autorizó publicar su nombre y foto"
            items={data.team} blank={{ name: '', role: '', bio: '' }} reload={reload}
            fromItem={(m) => ({ name: m.name, role: m.role, bio: m.bio })}
            nameOf={(f) => f.name}
            body={(f) => ({ name: f.name.trim(), role: f.role.trim(), bio: f.bio.trim() })}
            valid={(f) => f.name.trim().length >= 2 && f.role.trim().length >= 2 && f.bio.trim().length >= 2}
            needsAuth={(m, f, photoChanged) => !m || f.name.trim() !== m.name || photoChanged || (m.isSample && (f.role.trim() !== m.role || f.bio.trim() !== m.bio))}
            card={(m) => ({ name: m.name, title: m.role, body: <p>{m.bio}</p> })}
            fields={(f, set) => (
              <>
                <Field label="Nombre">{(id) => <input id={id} className="input" value={f.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} placeholder="Dra. Nombre Apellido" />}</Field>
                <Field label="Cargo o especialidad">{(id) => <input id={id} className="input" value={f.role} maxLength={160} onChange={(e) => set({ role: e.target.value })} placeholder="Socia directora" />}</Field>
                <Field label="Descripción" hint={`${f.bio.length}/400`}>{(id) => <textarea id={id} className="input min-h-24" value={f.bio} maxLength={400} onChange={(e) => set({ bio: e.target.value })} />}</Field>
              </>
            )}
          />
        ) : (
          <ContentSection<AdminTestimonial, TestimonialForm>
            key="testimonials" path="testimonials" singular="Testimonio" addLabel="Añadir testimonio" empty="No hay testimonios todavía"
            authText="que tengo autorización escrita de esta persona para publicar su testimonio, nombre y foto"
            items={data.testimonials} blank={{ quote: '', author: '', kind: 'Cliente' }} reload={reload}
            fromItem={(t) => ({ quote: t.quote, author: t.author, kind: t.kind })}
            nameOf={(f) => f.author}
            body={(f) => ({ quote: f.quote.trim(), author: f.author.trim(), kind: f.kind.trim() })}
            valid={(f) => f.quote.trim().length >= 10 && f.author.trim().length >= 2 && f.kind.trim().length >= 2}
            needsAuth={(t, f, photoChanged) => !t || photoChanged || f.quote.trim() !== t.quote || f.author.trim() !== t.author || f.kind.trim() !== t.kind}
            card={(t) => ({ name: t.author, title: t.kind, body: <blockquote>“{t.quote}”</blockquote> })}
            fields={(f, set) => (
              <>
                <Field label="Testimonio" hint={`${f.quote.length}/600`}>{(id) => <textarea id={id} className="input min-h-28" value={f.quote} maxLength={600} onChange={(e) => set({ quote: e.target.value })} />}</Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre o iniciales" hint="Como quiere que aparezca">{(id) => <input id={id} className="input" value={f.author} maxLength={120} onChange={(e) => set({ author: e.target.value })} placeholder="M. R." />}</Field>
                  <Field label="Tipo">{(id) => <><input id={id} className="input" list="kinds" value={f.kind} maxLength={80} onChange={(e) => set({ kind: e.target.value })} /><datalist id="kinds"><option value="Cliente" /><option value="Inversionista" /></datalist></>}</Field>
                </div>
              </>
            )}
          />
        )}
      </div>
    </>
  );
}

export default function ContentPage() {
  return <SuperOnly><Content /></SuperOnly>;
}
