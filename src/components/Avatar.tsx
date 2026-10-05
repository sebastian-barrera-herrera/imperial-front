import { cn } from '@/lib/cn';

const initials = (name: string) =>
  name.replace(/^(Dra?\.|Sra?\.)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

/** Foto si existe; si no, monograma con las iniciales (sin rostros de archivo). */
export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={96} height={96} loading="lazy" className={cn('h-16 w-16 rounded-full object-cover', className)} />;
  }
  return (
    <span aria-hidden className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-semibold text-white', className)}>
      {initials(name)}
    </span>
  );
}
