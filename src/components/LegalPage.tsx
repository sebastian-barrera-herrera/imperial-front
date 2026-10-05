import Link from 'next/link';
import type { ReactNode } from 'react';
import { site } from '@/lib/site';
import { BrandInline, Logo } from './Brand';
import { ThemeToggle } from './ThemeToggle';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <Logo variant="mark" width={44} />
          <p className="mt-2 font-semibold uppercase tracking-[0.16em] text-slate-800">{site.name}</p>
          <p className="mt-1">Las proyecciones, valoraciones y estimaciones mostradas en la plataforma son informativas y no constituyen garantía de resultados. Toda inversión implica riesgo.</p>
          <p className="mt-2">{site.legal.city} · Atendemos a toda Latinoamérica</p>
          <p className="mt-1">Contacto: <a className="underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></p>
        </div>
        <nav aria-label="Información legal" className="flex flex-col gap-2 md:items-end">
          <Link className="underline" href="/aviso-de-privacidad">Aviso de privacidad</Link>
          <Link className="underline" href="/privacidad">Política de privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Contenedor común de las páginas legales: cabecera, índice opcional, contenido tipográfico y pie. */
export function LegalPage({ title, intro, toc, children }: { title: string; intro: string; toc?: { id: string; label: string }[]; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label={`${site.name}: inicio`}><BrandInline markWidth={40} /></Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost">Ingresar</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
          {toc && (
            <nav aria-label="Contenido de esta página" className="mb-8 lg:sticky lg:top-8 lg:mb-0 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">En esta página</p>
              <ol className="mt-3 space-y-1.5 text-sm">
                {toc.map((t, i) => (
                  <li key={t.id}><a href={`#${t.id}`} className="block rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-navy-900"><span className="mr-1.5 text-slate-500">{i + 1}.</span>{t.label}</a></li>
                ))}
              </ol>
            </nav>
          )}
          <article className={`legal ${toc ? '' : 'mx-auto max-w-3xl lg:col-span-2'}`}>
            <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">Versión {site.legal.privacyVersion} · Última actualización: {site.legal.privacyUpdated}</p>
            <p className="mt-6 text-lg leading-8 text-slate-700">{intro}</p>
            {children}
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
