'use client';

import { createElement, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Phase = 'idle' | 'hidden' | 'shown' | 'done';

/**
 * Aparece suavemente al entrar en pantalla (ver `.reveal` en globals.css).
 *
 * Sin JavaScript, o con «reducir movimiento», el contenido se ve siempre. El servidor y el primer render del cliente son
 * idénticos (sin clases); solo después de hidratar se oculta lo que está **bajo** el primer pantallazo, de modo que no hay
 * parpadeo ni diferencias de hidratación. Al terminar se quitan las clases para no interferir con los `hover`.
 */
export function Reveal({ as = 'div', delay = 0, className, children }: { as?: 'div' | 'li' | 'section'; delay?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // ya está a la vista (o por encima): se deja tal cual
    setPhase('hidden');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('shown');
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Terminada la transición (0,7 s + retraso) se quitan las clases; así el retraso no afecta a los `hover` posteriores.
  useEffect(() => {
    if (phase !== 'shown') return;
    const t = setTimeout(() => setPhase('done'), delay + 900);
    return () => clearTimeout(t);
  }, [phase, delay]);

  const active = phase === 'hidden' || phase === 'shown';
  return createElement(
    as,
    {
      ref,
      className: cn(active && 'reveal', phase === 'shown' && 'is-visible', className),
      style: active ? ({ '--d': `${delay}ms` } as CSSProperties) : undefined,
    },
    children,
  );
}
