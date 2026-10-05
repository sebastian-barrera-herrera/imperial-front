import { cn } from '@/lib/cn';
import { site } from '@/lib/site';

// Proporciones reales de los archivos (ancho / alto) para reservar el espacio y evitar saltos de diseño.
const RATIO = { full: 955 / 900, mark: 575 / 640 } as const;

type Tone = 'auto' | 'onDark' | 'onLight';

/**
 * Logo de la marca. `auto` usa la versión azul en tema claro y la crema en tema oscuro (cambia con la clase `dark`, sin parpadeo);
 * `onDark` fuerza la crema (superficies siempre oscuras: sidebar, portada) y `onLight` fuerza la azul.
 */
export function Logo({ variant = 'mark', tone = 'auto', width, className }: { variant?: 'full' | 'mark'; tone?: Tone; width: number; className?: string }) {
  const height = Math.round(width * RATIO[variant]);
  const img = (src: string, extra?: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={site.name} width={width} height={height} decoding="async" className={cn('h-auto max-w-full select-none', extra, className)} style={{ width }} draggable={false} />
  );
  const navy = `/brand/${variant === 'full' ? 'logo' : 'mark'}-navy.webp`;
  const cream = `/brand/${variant === 'full' ? 'logo' : 'mark'}-cream.webp`;
  if (tone === 'onDark') return img(cream);
  if (tone === 'onLight') return img(navy);
  return <>{img(navy, 'block dark:hidden')}{img(cream, 'hidden dark:block')}</>;
}

/** Emblema + nombre en mayúsculas espaciadas, como en el logo. En pantallas muy angostas queda solo el emblema. */
export function BrandInline({ tone = 'auto', markWidth = 38, alwaysName = false }: { tone?: Tone; markWidth?: number; alwaysName?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Logo variant="mark" tone={tone} width={markWidth} />
      <span className={cn(alwaysName ? 'inline' : 'hidden min-[430px]:inline', 'truncate text-[0.78rem] font-semibold uppercase tracking-[0.18em]', tone === 'onDark' ? 'text-cream' : 'text-navy-900')}>{site.name}</span>
    </span>
  );
}
