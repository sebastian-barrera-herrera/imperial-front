'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from './ui';

type Mode = 'light' | 'dark' | 'system';
const ORDER: Mode[] = ['light', 'dark', 'system'];
const LABELS: Record<Mode, string> = { light: 'Tema claro', dark: 'Tema oscuro', system: 'Tema del sistema' };
const ICONS = { light: Sun, dark: Moon, system: Monitor };

/** Aplica la clase `dark` según la preferencia elegida. Sin elección guardada el tema es claro; «sistema» sigue al sistema operativo. El script inline del layout hace lo mismo antes de pintar. */
function apply(mode: Mode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeToggle({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const [mode, setMode] = useState<Mode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: Mode = 'light';
    try {
      const v = localStorage.getItem('theme');
      if (v === 'light' || v === 'dark' || v === 'system') stored = v;
    } catch { /* almacenamiento bloqueado: se usa el tema claro */ }
    setMode(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode, mounted]);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
    try {
      localStorage.setItem('theme', next);
    } catch { /* ignorado */ }
    apply(next);
  }

  const Icon = ICONS[mode];
  return (
    <button type="button" onClick={cycle} title={`${LABELS[mode]} (clic para cambiar)`} aria-label={`${LABELS[mode]}. Cambiar tema`}
      className={cn('inline-flex h-10 w-10 items-center justify-center rounded-full transition', onDark ? 'text-night-200 hover:bg-night-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100', className)}>
      {/* Hasta montar se muestra un icono neutro para no desajustar la hidratación */}
      {mounted ? <Icon className="h-5 w-5" aria-hidden /> : <Monitor className="h-5 w-5 opacity-0" aria-hidden />}
    </button>
  );
}

// Se inyecta en <head>: evita el destello de tema incorrecto al cargar.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})();`;
