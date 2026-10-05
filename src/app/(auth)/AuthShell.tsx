import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandInline, Logo } from '@/components/Brand';
import { ThemeToggle } from '@/components/ThemeToggle';
import { site } from '@/lib/site';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-night-900 p-12 text-night-100 lg:flex">
        <Link href="/" aria-label={`${site.name}: inicio`}><Logo variant="full" tone="onDark" width={190} /></Link>
        <div>
          <h2 className="font-serif text-4xl font-semibold leading-tight text-white">{site.tagline}</h2>
          <p className="mt-4 max-w-md text-night-200">Sube tus documentos, solicita desembolsos y sigue cada etapa de tu caso desde un solo lugar.</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-night-300"><ShieldCheck className="h-4 w-4 text-cream" aria-hidden /> Tus datos bancarios y de identidad se almacenan cifrados.</p>
      </div>
      <div className="relative flex items-center justify-center px-6 py-12">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center lg:hidden" aria-label={`${site.name}: inicio`}><BrandInline alwaysName markWidth={40} /></Link>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mb-8 mt-2 text-sm text-slate-600">{subtitle}</p>
          {children}
          <p className="mt-8 text-center text-xs text-slate-500">
            <Link href="/aviso-de-privacidad" className="underline">Aviso de privacidad</Link> · <Link href="/privacidad" className="underline">Política de privacidad</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
