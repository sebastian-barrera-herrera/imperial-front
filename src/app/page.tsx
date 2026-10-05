import { ArrowRight, BarChart3, BellRing, Banknote, FileCheck2, Info, LineChart, Lock, Menu, Search, ShieldCheck, UploadCloud, UserCheck } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Avatar } from '@/components/Avatar';
import { BrandInline, Logo } from '@/components/Brand';
import { LandingPreview } from '@/components/LandingPreview';
import { Reveal } from '@/components/Reveal';
import { SiteFooter } from '@/components/LegalPage';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getSiteContent } from '@/lib/content';
import { site } from '@/lib/site';

// Equipo y testimonios vienen de la API (se refrescan solos cada 30 s y al instante al guardar desde el panel).
export const revalidate = 30;

const STEPS = [
  { icon: UploadCloud, title: 'Carga tus documentos', text: 'Identidad, soportes bancarios, documentos legales y comprobantes, organizados por categoría.' },
  { icon: FileCheck2, title: 'Validamos cada archivo', text: 'Nuestro equipo revisa tus documentos y te avisa al instante si falta o debe corregirse algo.' },
  { icon: Banknote, title: 'Solicita tu desembolso', text: 'Con tus documentos validados, creas la solicitud y sigues su estado paso a paso.' },
  { icon: BellRing, title: 'Recibe alertas en vivo', text: 'Cada cambio en tu caso o en tu solicitud llega como notificación, sin tener que preguntar.' },
];

const FEATURES = [
  { icon: Search, title: 'Seguimiento transparente', text: 'Línea de tiempo con la etapa actual de tu caso, los documentos requeridos y los próximos pasos.' },
  { icon: Lock, title: 'Datos protegidos', text: 'Cédula y datos bancarios cifrados, acceso por roles y registro de auditoría de cada consulta.' },
  { icon: ShieldCheck, title: 'Respaldo jurídico', text: 'Un abogado asignado lleva tu caso y valida cada paso del proceso de recuperación.' },
];

const INVESTOR_POINTS = [
  'Valor por unidad de cada oportunidad, actualizado por el despacho con su historial.',
  'Gráfico interactivo con la evolución de tu portafolio frente al capital aportado.',
  'Ganancia, rentabilidad y rendimiento anualizado de cada posición.',
  'Alerta en tu cuenta cada vez que se publica una nueva valoración.',
];

const NAV = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#inversion', label: 'Inversión' },
  { href: '#equipo', label: 'Equipo', needs: 'team' as const },
  { href: '#testimonios', label: 'Testimonios', needs: 'testimonials' as const },
];

/** Se muestra solo mientras haya contenido de ejemplo publicado: el sitio nunca presenta ejemplos como si fueran reales. */
function SampleBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden /> Contenido ilustrativo de ejemplo
    </p>
  );
}

export default async function Home() {
  const { team, testimonials } = await getSiteContent();
  const NAV_ITEMS = NAV.filter((n) => !n.needs || (n.needs === 'team' ? team.length : testimonials.length) > 0);
  const teamHasSample = team.some((m) => m.isSample);
  const testimonialsHaveSample = testimonials.some((t) => t.isSample);
  return (
    <div>
      <header className="header-scroll anim-fade sticky top-0 z-40 border-b border-slate-200 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link href="/" className="min-w-0" aria-label={`${site.name}: inicio`}><BrandInline /></Link>
          <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((n) => <a key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy-900">{n.label}</a>)}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">Ingresar</Link>
            <Link href="/register" className="btn-primary">Crear cuenta</Link>
            <details className="relative md:hidden">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 [&::-webkit-details-marker]:hidden" aria-label="Menú de secciones"><Menu className="h-5 w-5" aria-hidden /></summary>
              <div className="anim-menu absolute right-0 top-12 w-56 rounded-xl border border-slate-200 bg-surface p-2 shadow-lg">
                {NAV_ITEMS.map((n) => <a key={n.href} href={n.href} className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100">{n.label}</a>)}
                <Link href="/login" className="mt-1 block rounded-lg border-t border-slate-100 px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-slate-100 sm:hidden">Ingresar</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-night-900 text-white">
        <div aria-hidden className="glow -z-10" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-5 lg:py-24">
          <div className="lg:col-span-3">
            <p className="anim-rise mb-4 inline-block rounded-full border border-cream/30 px-3 py-1 text-xs font-medium uppercase tracking-widest text-cream/80">Despacho de abogados</p>
            <h1 className="anim-rise font-serif text-3xl [--d:90ms] font-semibold leading-tight !text-cream sm:text-5xl">Recupera tu capital con acompañamiento legal de principio a fin</h1>
            <p className="anim-rise mt-5 max-w-xl text-base text-night-200 [--d:180ms] sm:text-lg">Gestiona tu caso, carga tus documentos, solicita desembolsos y consulta el avance en una plataforma segura y clara.</p>
            <div className="anim-rise mt-8 flex flex-col gap-3 [--d:270ms] sm:flex-row">
              <Link href="/register" className="btn-cream group px-6 py-3 text-base">Comenzar ahora <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></Link>
              <Link href="/login" className="btn border border-night-500 px-6 py-3 text-base text-white hover:bg-night-800">Ya tengo cuenta</Link>
            </div>
            <ul className="anim-rise mt-10 grid gap-3 text-sm text-night-200 [--d:360ms] sm:grid-cols-3">
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 shrink-0 text-cream/80" aria-hidden /> Datos cifrados</li>
              <li className="flex items-center gap-2"><UserCheck className="h-4 w-4 shrink-0 text-cream/80" aria-hidden /> Abogado asignado</li>
              <li className="flex items-center gap-2"><BellRing className="h-4 w-4 shrink-0 text-cream/80" aria-hidden /> Alertas en tiempo real</li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <div className="anim-rise rounded-2xl border border-night-700 bg-night-800/60 p-6 backdrop-blur-sm [--d:240ms]">
              <div className="flex justify-center"><Logo variant="full" tone="onDark" width={176} /></div>
              <div className="my-5 h-px bg-night-700" />
              <p className="text-xs font-medium uppercase tracking-widest text-cream/70">Tu caso, en tiempo real</p>
              <ol className="mt-4 space-y-3 text-sm">
                {['Recepción del caso', 'Revisión de documentos', 'Análisis jurídico', 'Negociación', 'Recuperación', 'Desembolso'].map((s, i) => (
                  <li key={s} className="anim-rise flex items-center gap-3" style={{ '--d': `${520 + i * 90}ms` } as CSSProperties}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${i < 3 ? 'anim-pop bg-cream text-night-900' : i === 3 ? 'anim-ring bg-night-600 text-white' : 'bg-night-700 text-night-200'}`} style={{ '--d': `${620 + i * 90}ms` } as CSSProperties}>{i + 1}</span>
                    <span className={i < 3 ? 'text-cream' : 'text-night-200'}>{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-night-200">Ejemplo ilustrativo del seguimiento por etapas.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-20">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">Así funciona</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Un proceso simple, con validaciones claras en cada paso.</p>
        </Reveal>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 90} className="card card-lift group p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700 transition-colors duration-300 group-hover:bg-navy-100"><Icon className="h-5 w-5" aria-hidden /></span>
                <span className="font-serif text-2xl text-navy-300">{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="border-y border-slate-200 bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 110} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700"><Icon className="h-5 w-5" aria-hidden /></span>
              <div>
                <h3 className="font-semibold text-navy-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="inversion" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-navy-600"><LineChart className="h-4 w-4" aria-hidden /> Para quienes invierten</span>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Tu inversión, con métricas claras</h2>
            <p className="mt-3 text-slate-600">Si participas en una de nuestras oportunidades de capital, sigues su valor como en una plataforma de inversión: cifras actualizadas, historial y rendimiento, siempre con el respaldo del despacho.</p>
            <ul className="mt-6 space-y-3">
              {INVESTOR_POINTS.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-slate-700"><BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-series-1" aria-hidden />{p}</li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-slate-500">Toda inversión implica riesgo de pérdida de capital. Los rendimientos pasados no garantizan resultados futuros.</p>
          </Reveal>
          <Reveal delay={150}><LandingPreview /></Reveal>
        </div>
      </section>

      {team.length > 0 && (
      <section id="equipo" className="scroll-mt-20 border-y border-slate-200 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <Reveal>
            <h2 className="text-2xl font-semibold sm:text-3xl">Un equipo que te acompaña</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">Abogados dedicados a la recuperación de capital y a mantenerte informado en cada etapa.</p>
            <SampleBadge show={teamHasSample} />
          </Reveal>
          <ul className="mt-10 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <Reveal as="li" key={m.id} delay={(i % 4) * 90} className="card-lift rounded-xl border border-slate-200 bg-paper p-5">
                <Avatar name={m.name} src={m.photoUrl ?? undefined} />
                <h3 className="mt-4 text-base font-semibold">{m.name}</h3>
                <p className="text-sm font-medium text-navy-600">{m.role}</p>
                <p className="mt-2 text-sm text-slate-600">{m.bio}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
      )}

      {testimonials.length > 0 && (
      <section id="testimonios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 text-center sm:px-6 lg:py-20">
        <Reveal>
          <h2 className="text-2xl font-semibold sm:text-3xl">Lo que valoran quienes confían en nosotros</h2>
          <SampleBadge show={testimonialsHaveSample} />
        </Reveal>
        <ul className="mt-10 grid gap-5 text-left md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="li" key={t.id} delay={i * 100} className="card card-lift flex flex-col p-6">
              <blockquote className="flex-1 text-slate-700">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <Avatar name={t.author} src={t.photoUrl ?? undefined} className="h-10 w-10 text-sm" />
                <span className="text-sm"><span className="block font-semibold text-slate-900">{t.author}</span><span className="text-slate-500">{t.kind}</span></span>
              </figcaption>
            </Reveal>
          ))}
        </ul>
      </section>
      )}

      <section className="border-t border-slate-200 bg-surface">
        <Reveal className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">¿Listo para empezar?</h2>
          <p className="mt-3 text-slate-600">Crea tu cuenta, completa tu perfil y sube tus documentos. Nuestro equipo se encargará del resto.</p>
          <Link href="/register" className="btn-primary mt-8 px-8 py-3 text-base">Crear mi cuenta</Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
