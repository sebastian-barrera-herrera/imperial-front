/** Une clases condicionales. Vive fuera de los módulos 'use client' para poder usarse también en componentes de servidor. */
export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');
